
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<str:username>", views.profile, name="profile"),

    # API Routes
    path("posts/<str:postbox>", views.posts, name="posts"),
    path("new", views.new, name="new"),
    path("follow_profile", views.follow_profile, name="follow_profile"),
    path("following", views.following, name="following"),
    path("post", views.post, name="post"),
    path("like/<str:status>", views.like, name="like"),
    path("profile/profile/<str:username>", views.profile, name="profile/profile")
]
