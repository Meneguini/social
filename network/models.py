from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    follower_number = models.PositiveIntegerField(default=0)
    following_number = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"User {self.username} is followed by {self.follower_number} and is following {self.following_number}."


class Post(models.Model):
    writer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="writers")
    content = models.TextField(max_length=300)
    datetime = models.DateTimeField(auto_now_add=True)
    likes_number = models.PositiveIntegerField(default=0)


    # Returning dict instead of a string
    def serialize(self):
        return {
            "id": self.id,
            "writer": self.writer.username,
            "followers_number": self.writer.follower_number,
            "following_number": self.writer.following_number,
            "content": self.content,
            "datetime": self.datetime.strftime("%b %d %Y, %I:%M %p"),
            "likes_number": self.likes_number
        }


class Follow(models.Model):
    watcher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    watching = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followings")

    def __str__(self):
        return f"Follow {self.id}, {self.watcher.username} is following {self.watching.username}."


class Like(models.Model):
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    liked = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="liked_post")

    def __str__(self):
        return f"Like {self.id}, {self.liker} liked {self.liked}."

    def serialize(self):
        return {
            "liker": self.liker.username,
            "liked": self.liked.id
        }