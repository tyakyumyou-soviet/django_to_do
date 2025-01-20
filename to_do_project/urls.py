# config/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf.urls import handler404
from todo.views import custom_404_view

from django.conf import settings
from django.conf.urls.static import static

from django.views.static import serve 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('todo.urls')),
    re_path(r'^static/(?P<path>.*)$', serve,{'document_root': settings.STATIC_ROOT}),
]

# 独自404ページの設定
handler404 = custom_404_view

if not settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL, 
        document_root=settings.STATIC_ROOT
    )
