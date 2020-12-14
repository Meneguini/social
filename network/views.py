from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django import forms
from .models import User, Post, Follow, Like
from . import utils
import json


@login_required
def delete_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "Request must be POST."}, status=400)

    data = json.loads(request.body)
    
    try:
        post = Post.objects.filter(pk=data["post_id"]).delete()
    except:
        return JsonResponse({"error": "Post not deleted!"}, status=400)

    return JsonResponse({"msg": "Post deleted!"}, status=200)


@login_required
def like(request, status):
    if request.method != "PUT":
        return JsonResponse({"error": "Request must be PUT."}, status=400)

    data = json.loads(request.body)
    if data.get("post_id") == "":
        return JsonResponse({"error": "No post id"}, status=400)
    
    post = Post.objects.get(pk=data["post_id"])
    
    if status == 'like':

        new_like = Like.objects.create(liker=request.user, liked=post)
        new_like.save()
        post.likes_number = post.likes_number + 1
        post.save()
        return JsonResponse({
            "msg": "liked",
            "likes_number": post.likes_number
            }, status=200)

    # If unlike
    deleted_like = Like.objects.get(liker=request.user, liked=post)
    deleted_like.delete()
    post.likes_number = post.likes_number - 1
    post.save()
    return JsonResponse({
        "msg": "unliked",
        "likes_number": post.likes_number
    }, status=200)


@login_required
def post(request):

    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)

    data = json.loads(request.body)
    if data.get("content") == "":
        return JsonResponse({"error": "There is no content"}, status=400)
    
    post_id = int(data["idPost"])
    try:
        post = Post.objects.get(pk=post_id, writer=request.user)
        post.content = data["content"]
        post.save()
    except:
        return JsonResponse({"error": "Post not found!"}, status=400)
    return JsonResponse({"saved": True}, status=200)


@login_required
def following(request):
    follows = Follow.objects.filter(watcher=request.user)
    posts = []
    for follow in follows:
        user_posts = Post.objects.filter(writer=follow.watching)
        
        for post in user_posts:
            posts.append(post)
            
    # there is a way to use the own object attribute as key to sort 
    # https://docs.python.org/3/howto/sorting.html
    posts = sorted(posts, key=lambda instance: instance.datetime, reverse=True)
    # Using my function in utils to create a list with the posts and the if the post was liked by user
    final = utils.posts_like(posts, request.user)
    # Using Django paginator for the following page
    paginator = Paginator(final, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, "network/following.html", {
        "page_obj": page_obj
    })
    

@login_required
def follow_profile(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Request is not a POST!"}, status=400)

    info = json.loads(request.body)
    profile = info.get("profile").lower()
    follow = info.get("follow")

    try:
        watching = User.objects.get(username=profile)
    except:
        return JsonResponse({"error": "User not found!"}, status=404)

    if follow == "Follow":

        # Add this follow into db 
        new_follow = Follow.objects.create(watcher=request.user, watching=watching)
        new_follow.save()
        # Update Users following and being followed
        logged_user = request.user
        logged_user.following_number =  logged_user.following_number + 1
        logged_user.save()

        watching.follower_number = watching.follower_number + 1
        watching.save()

    else:
        # If unfollow delete the follow on the follow table
        delete_follow = Follow.objects.filter(watcher=request.user, watching=watching)
        delete_follow.delete()
        # Update Users following and being followed 
        logged_user = request.user
        logged_user.following_number =  logged_user.following_number - 1
        logged_user.save()

        watching.follower_number = watching.follower_number - 1
        watching.save()

    new_profile = User.objects.get(username=profile)
    # Create a dict and return it as json to the frontend with profile data updated
    person = {
        "username": new_profile.username,
        "following_number": new_profile.following_number,
        "follower_number": new_profile.follower_number
    }
    return JsonResponse(person, status=200)


def profile(request, username):
    try:
        post_owner = User.objects.get(username=username)
    except:
        return JsonResponse({"error": "User not found!"}, status=404)
    
    posts = Post.objects.filter(writer=post_owner).order_by("-datetime")

    # Using my util function to create my list of posts 
    posts = utils.posts_like(posts, request.user)
    # If the profile page has more pages with posts
    if len(posts) > 10:
        pages = True
        posts = posts[:10]
    else:
        pages = False
    # If the user logged is different of the profile user than this owner variable will tell the front if you can follow or not 
    if post_owner != request.user:
        owner = False
    else:
        owner = True
    # Check if the user logged is following the profile owner
    try:
        follow_check = Follow.objects.get(watcher=request.user, watching=post_owner)
        follow = True
    except:
        follow = False

    return render(request, "network/profile.html", {
        "posts": posts,
        "profile": post_owner,
        "owner": owner,
        "follow": follow,
        "pages": pages
    })



@login_required
def new(request):
    if request.method != "POST":
        return JsonResponse({"Error": "Requires a POST request!"}, status=400)
    
    info = json.loads(request.body)
    content = info.get("content")

    if content == "":
        return JsonResponse({"unsuccessful": "No content!"}, status=400)

    if len(content) > 300:
        return JsonResponse({"unsuccessful": "Maximum 300 letters!"}, status=400)
    # Adding new post to db
    new_post = Post.objects.create(writer=request.user, content=content)
    new_post.save()
    return JsonResponse({"msg": "Post added!"}, status=200)
    

def posts(request, postbox):

    postbox = postbox.lower()
    start = int(request.GET.get("start"))
    end = int(request.GET.get("end"))
    # If different than all it means you are seeing the posts of a profile
    if postbox != "all":
        try:
            username = User.objects.get(username=postbox)
        except:
            return JsonResponse({"error": "User not found and posts not found"})
        try:
            posts = Post.objects.filter(writer=username).order_by("-datetime")
            total_posts = len(posts)
            posts = posts[start:end]
        except:
            # Or User has no posts?
            return JsonResponse({"error": "User posts not Found"})
    # Else you need all posts because you are in the index
    else:
        posts = Post.objects.all().order_by("-datetime")
        total_posts = len(posts)
        posts = posts[start:end]

    # check if there is a next page
    next_page = total_posts - end - 1
    if next_page > 0:
        next_page = True
    else:
        next_page = False
    # Check if there is a previous page
    if start != 0 and end != 9:
        previous_page = True
    else:
        previous_page = False
    # Getting all the likes this user gave
    try:
        likes = Like.objects.filter(liker=request.user)
        likes = [like.serialize() for like in likes]
        user_logged = request.user.username
    except:
        likes = False
        user_logged = False
    # From last project (mail) 
    # Serializing my return (transforming my return in json, safe=False if the data is not a dict)
    return JsonResponse({
        "posts": [post.serialize() for post in posts],
        "next_page": next_page,
        "previous_page": previous_page,
        "start": start,
        "user_logged": user_logged,
        "likes": likes
    }, safe=False)


def index(request):
    data = Post.objects.all().order_by("-datetime")
    # Function from utils get posts and checks if post was liked by the user logged
    final_posts = utils.posts_like(data, request.user)
    # Checking if there is more pages
    if len(data) > 10:
        pages = True
    else:
        pages = False   

    final_posts = final_posts[:10]

    return render(request, "network/index.html", {
        "posts": final_posts,
        "pages": pages
    })


def login_view(request):
    if request.method != "POST":
        return render(request, "network/login.html")

    # Attempt to sign user in
    username = request.POST["username"]
    password = request.POST["password"]
    user = authenticate(request, username=username, password=password)

    # Check if authentication was successful
    if user is not None:
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/login.html", {
            "message": "Invalid username and/or password."
        })
    
        
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method != "POST":
        return render(request, "network/register.html")

    username = request.POST["username"]
    email = request.POST["email"]

    # Ensure password matches confirmation
    password = request.POST["password"]
    confirmation = request.POST["confirmation"]
    if password != confirmation:
        return render(request, "network/register.html", {
            "message": "Passwords must match."
        })
    # Ensure password have at least 6 characters
    if len(password) < 6:
        return render(request, "network/register.html", {
            "message": "Passwords must have at least 6 characters."
        })

    # Attempt to create new user
    try:
        user = User.objects.create_user(username, email, password)
        user.save()
    except IntegrityError:
        return render(request, "network/register.html", {
            "message": "Username already taken."
        })
    login(request, user)
    return HttpResponseRedirect(reverse("index"))
    

