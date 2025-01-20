# todo/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Max, Min
import json

from .models import Task

def custom_404_view(request, exception):
    """
    独自の404 Not Foundページ (省略せず)
    """
    return render(request, '404.html', status=404)

def login_view(request):
    """
    ログイン画面
    """
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('tasks')
        else:
            return render(request, 'login.html', {
                'error_message': 'ユーザー名またはパスワードが違います。'
            })
    return render(request, 'login.html')

def logout_view(request):
    """
    ログアウト
    """
    logout(request)
    return redirect('login')

def register_view(request):
    """
    アカウント作成ページ
    """
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        password2 = request.POST.get('password2', '')

        # バリデーション
        if not username or not password:
            return render(request, 'register.html', {
                'error_message': 'ユーザー名とパスワードは必須です。'
            })
        if password != password2:
            return render(request, 'register.html', {
                'error_message': 'パスワードが一致しません。'
            })

        # ユーザー名がすでに存在していないか確認
        if User.objects.filter(username=username).exists():
            return render(request, 'register.html', {
                'error_message': 'そのユーザー名は既に使われています。'
            })

        # 新規ユーザー作成
        user = User.objects.create_user(username=username, password=password)
        # 自動ログインする場合
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('tasks')  # そのままタスクページへ

        # あるいは自動ログインせず loginページへ
        # return redirect('login')

    return render(request, 'register.html')

@login_required
def tasks_view(request):
    """
    ログイン必須のタスク一覧
    """
    tasks = Task.objects.filter(owner=request.user, is_deleted=False).order_by('sort_order')
    trash_tasks = Task.objects.filter(owner=request.user, is_deleted=True).order_by('sort_order')
    return render(request, 'index.html', {
        'tasks': tasks,
        'trash_tasks': trash_tasks,
        'user_name': request.user.username,
    })

@csrf_exempt
@login_required
def add_task(request):
    """
    Ajaxでタスク追加
    """
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        title = data.get('title', '').strip()
        reversed_order = data.get('reversed', False)

        if not title:
            return JsonResponse({'error': 'No title provided.'}, status=400)

        max_order = Task.objects.filter(owner=request.user, is_deleted=False).aggregate(Max('sort_order'))['sort_order__max']
        min_order = Task.objects.filter(owner=request.user, is_deleted=False).aggregate(Min('sort_order'))['sort_order__min']
        if max_order is None:
            max_order = 0
        if min_order is None:
            min_order = 0

        if reversed_order:
            sort_value = min_order - 1
        else:
            sort_value = max_order + 1

        task = Task.objects.create(
            title=title,
            owner=request.user,
            sort_order=sort_value
        )
        return JsonResponse({
            'id': task.id,
            'title': task.title,
            'is_deleted': task.is_deleted,
            'sort_order': task.sort_order
        })
    return JsonResponse({'error': 'Invalid method'}, status=405)

@csrf_exempt
@login_required
def edit_task(request, task_id):
    """
    Ajaxでタスク編集
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        new_title = data.get('title', '').strip()
        if not new_title:
            return JsonResponse({'error': 'Empty title'}, status=400)

        task = get_object_or_404(Task, pk=task_id, owner=request.user)
        task.title = new_title
        task.save()
        return JsonResponse({'status': 'ok', 'title': new_title})
    else:
        return JsonResponse({'error': 'Invalid method'}, status=405)

@login_required
def move_to_trash(request, task_id):
    """
    タスクをゴミ箱に移動
    """
    task = get_object_or_404(Task, pk=task_id, owner=request.user)
    task.is_deleted = True
    task.save()
    return redirect('tasks')

@login_required
def restore_task(request, task_id):
    """
    ゴミ箱タスクを復元
    """
    task = get_object_or_404(Task, pk=task_id, owner=request.user)
    task.is_deleted = False
    task.save()
    return redirect('tasks')

@login_required
def permanent_delete(request, task_id):
    """
    ゴミ箱タスクを完全削除
    """
    task = get_object_or_404(Task, pk=task_id, owner=request.user)
    task.delete()
    return redirect('tasks')
