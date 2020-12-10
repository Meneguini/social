from django.contrib import admin
from .models import User, Post, Follow, Like

class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'follower_number', 'following_number')

class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'writer', 'content', 'datetime', 'likes_number')

class FollowAdmin(admin.ModelAdmin):
    list_display = ('id', 'watcher', 'watching')

class LikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'liker', 'liked')

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(Like, LikeAdmin )