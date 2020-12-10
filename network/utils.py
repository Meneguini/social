from .models import User, Post, Follow, Like


def posts_like(posts, user_logged):
    """This function checks if the post was liked or not by the user logged"""
    final_posts = []
    for post in posts:
        try:
            like = Like.objects.get(liker=user_logged, liked=post)
            like = True
        except:
            like = False

        tem_post = {
            "id": post.id,
            "writer": post.writer,
            "content": post.content,
            "datetime": post.datetime,
            "likes_number": post.likes_number,
            "liked": like 
        }
        
        final_posts.append(tem_post)

    return final_posts