# todo/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),  # ← 新規追加
    path('tasks/', views.tasks_view, name='tasks'),

    path('add_task/', views.add_task, name='add_task'),
    path('edit_task/<int:task_id>/', views.edit_task, name='edit_task'),
    path('move_to_trash/<int:task_id>/', views.move_to_trash, name='move_to_trash'),
    path('restore_task/<int:task_id>/', views.restore_task, name='restore_task'),
    path('permanent_delete/<int:task_id>/', views.permanent_delete, name='permanent_delete'),
]
