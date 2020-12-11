document.addEventListener('DOMContentLoaded', function () {
    console.log("JS READY");
    // Adding event listeners if these elements exist in the dom
    if (document.querySelector("#btn-next") && document.querySelector("#index-page")) {
        document.querySelector("#btn-next").addEventListener('click', () => nextPage('all', 0));
    }

    if (document.querySelector("#btn-next") && document.querySelector(".user-container")) {
        document.querySelector("#btn-next").addEventListener('click', () => nextPage(document.querySelector("#profile-name").innerHTML, 0));
    }

    if (document.querySelector('#follow')){
        document.querySelector('.btn-follow').addEventListener('click', () => followProfile());
    }

    if (document.querySelector('#btn-edit')) {
            document.querySelectorAll('#btn-edit').forEach(btn => {
            btn.addEventListener('click', editPost, false);
        })
    }

    if (document.querySelector('#textarea-edit')) {
        document.querySelector('#textarea-edit').style.display = 'none';
        document.querySelectorAll('#btn-save').forEach(btn => {
            btn.addEventListener('click', savePost, false);
        })
    }

    if (document.querySelector('#empty-heart')) {
        document.querySelectorAll('#empty-heart').forEach(like => {
            like.addEventListener('click', event => { likePost(event, 'like'); });
        })
    }

    if (document.querySelector('#full-heart')) {
        document.querySelectorAll('#full-heart').forEach(unlike => {
            unlike.addEventListener('click', event => { likePost(event, 'unlike'); });
        })
    }

    if (document.querySelector('.del-btn')) {
        document.querySelectorAll('.del-btn').forEach(del => {
            del.addEventListener('click', event => { deletePost(event); });
        })
    }

    // If there is a new-post div means you are logged in and in the index page 
    if(document.querySelector('#new-post')){
        addPost();
    }

});

//------------ All Fetchs ------------

function deletePost(evt) {

    const csrftoken = getCookie('csrftoken');

    fetch(`/delete_post`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            // Using the event target to get the post id
            post_id: evt.target.parentElement.parentElement.children[2].innerHTML
        })
    })
    .then(response => response.json())
    .then(response => {
        updateDeleted(evt, response);
    })
    .catch(error => {
        console.log("Error: ", error);
    });

    return false;

}

function likePost(evt, like) {

    const csrftoken = getCookie('csrftoken');

    fetch(`/like/${like}`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            // Using the event target to get the post id
            post_id: evt.target.parentElement.parentElement.children[2].innerHTML
        })
    })
    .then(response => response.json())
    .then(response => {
        updateLike(evt, response);
    })
    .catch(error => {
        console.log("Error: ", error);
    });

    return false;
}

function savePost(evt) {
    // This fetch saves the change in the post content
    const idPost = evt.target.parentElement.children[1].innerHTML;
    const content = evt.target.parentElement.children[0].value;
    
    const csrftoken = getCookie('csrftoken');

    fetch(`/post`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            content: content,
            idPost: idPost
        })
    })
    .then(response => response.json())
    .then(saved => {
        // after saving
        updatePost(evt, content);
    })
    .catch(error => {
        console.log('Error: ', error);
    })
    return false;
}

function addPost() {
    // If you submit the form
    document.querySelector('#new-post').onsubmit = function () {
        // get the csrf_token in the coookie
        const csrftoken = getCookie('csrftoken');
        // send a post request
        fetch('/new', {
            method: 'POST',
            // Set a header in your Ajax as determined by Django docs passing the csrf_token
            headers: {
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                content: document.querySelector('#new-post-content').value,
            })
        })
        .then(response => response.json())
        .then(result => {
            // If you added the post successfully call fetchPosts to update the posts on the index page

            if (result.msg) {
                succesMsg(result.msg);
            }
            return fetchPosts('all', 0, 10);
        })
        .catch(error => {
            console.log('Error', error);
        });
        // cleaning the content of the textarea
        document.querySelector('#new-post-content').value = '';
        return false;
    }        

}

function followProfile() {
    const profile = document.querySelector('#profile-name').innerHTML 
    let follow = document.querySelector('.btn-follow').innerHTML
    
    const csrftoken = getCookie('csrftoken');

    fetch('/follow_profile', {
        method: 'POST',
        // Set a header in your Ajax as determined by Django docs
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            profile: profile,
            follow: follow
        })
    })
    .then(response => response.json())
    .then(result => {
        // fetchProfile(profile);
        profileUpdate(result);
    })
    .catch(error => {
        console.log('Error', error);
    });
    return false;
}

// Get request to fetch all posts
function fetchPosts(postbox, start, end) {

    document.querySelector('#posts-container').innerHTML = '';
    
    // send get request passing if you want all posts or a specific user posts
    fetch(`/posts/${postbox}?start=${start}&end=${end}`)
    .then(response => response.json())
    .then(posts => {
        // Call displaysPosts(), it'll create the html of the posts
        displayPosts(postbox, posts);
    })
    .catch(error => {
        console.log('Error:', error);
    });
    return false;
}

// ------------- Elements updates -----------------

// Remove deleted post from page
function updateDeleted(evt, msg) {

    post = evt.target.parentElement.parentElement.parentElement;
    post.remove();
    document.querySelector('.msg').innerHTML = msg.msg;
    
}

// Update heart and likes after clicking to like
function updateLike(evt, response) {

    if (response.msg == 'liked') {
        evt.target.style.display = 'none';
        evt.target.parentElement.children[0].style.display = 'block';
    }

    if (response.msg == 'unliked') {
        evt.target.style.display = 'none';
        evt.target.parentElement.children[1].style.display = 'block';
    }
    evt.target.parentElement.children[2].innerHTML = response.likes_number;

}

function updatePost(evt, content) {
    
    evt.target.parentElement.parentElement.children[0].children[1].innerHTML = content;
    evt.target.parentElement.parentElement.children[0].style.display = 'block';
    evt.target.parentElement.parentElement.children[1].style.display = 'none';
}

function profileUpdate(details) {

    document.querySelector('#following').innerHTML = "Following " + details.following_number;
    document.querySelector('#follower').innerHTML = "Followers " + details.follower_number;
    const followCheck = document.querySelector('.btn-follow');
    
    if (followCheck.innerHTML == "Follow") {
        followCheck.innerHTML = "Unfollow";
    }
    else {
        followCheck.innerHTML = "Follow";
    }
}

function editPost(evt) {
    
    // const grandparent = evt.target.parentElement.parentElement;
    const grandparent = evt.target.parentElement.parentElement.parentElement;

    grandparent.children[1].children[0].value = `${grandparent.children[0].children[1].innerHTML}`;

    grandparent.children[1].style.display = 'block';
    grandparent.children[0].style.display = 'none';
    
}

function succesMsg(msg) {
    document.querySelector('.msg').innerHTML = msg;
}

// ---------------- Create elements and insert in DOM ----------------

function displayPosts(postbox, posts) {
    // Clean container to avoid having the same post duplicated everytime you fetch the posts
    document.querySelector('#posts-container').innerHTML = '';

    posts.posts.forEach(post => {
        // entire div
        const divPost = document.createElement('div');
        divPost.className = 'post-container';
        // div for entire post
        const div = document.createElement('div');
        div.id =  'post-parent';
        // div for textarea
        const divTextarea = document.createElement('div');
        divTextarea.id = 'textarea-edit';
        // div for likes and datetime
        const divLikesDate = document.createElement('div');
        divLikesDate.className = 'likes-datetime-edit';
        // div for Name and delete post button
        const writerBtndel = document.createElement('div');
        writerBtndel.className = "name-del-btn";

        const writer = document.createElement('a');
        writer.innerHTML = post.writer.charAt(0).toUpperCase() + post.writer.slice(1);
        writer.className = 'name';
        writer.id = 'nm-profile';
        if (postbox == 'all') {
            writer.href = `profile/${post.writer}`
        }

        writerBtndel.append(writer);

        if(posts.user_logged == post.writer) {
            const delBtn = document.createElement('img');
            delBtn.src = '/static/network/cross.png';
            delBtn.height = '25';
            delBtn.width = '25';
            delBtn.className = 'del-btn';
            delBtn.addEventListener('click', event => { deletePost(event); });
            writerBtndel.append(delBtn);
        }

        const content = document.createElement('p');
        content.innerHTML = post.content.charAt(0).toUpperCase() + post.content.slice(1);

        const postId = document.createElement('p');
        postId.innerHTML = post.id;
        postId.style.display = 'none';

        div.append(writerBtndel, content, postId);

        if (posts.user_logged) {

            const fullHeart = document.createElement('img');
            fullHeart.src = '/static/network/heart(2).png';
            fullHeart.height = '30';
            fullHeart.width = '30';
            fullHeart.style.display = 'none'
            fullHeart.id = 'full-heart';
            fullHeart.addEventListener('click', event => { likePost(event, 'unlike'); });

            const emptyHeart = document.createElement('img');
            emptyHeart.src = '/static/network/heart(3).png';
            emptyHeart.height = '30';
            emptyHeart.width = '30';
            emptyHeart.id = 'empty-heart';
            emptyHeart.addEventListener('click', event => { likePost(event, 'like'); });

            posts.likes.forEach(like => {
                if (like.liked == post.id) {
                    emptyHeart.style.display = 'none';
                    fullHeart.style.display = 'block';
                }
            })
            divLikesDate.append(fullHeart, emptyHeart);
        }
        else {
            const likeWord = document.createElement('p');
            likeWord.innerHTML = 'Likes:';
            likeWord.className = 'likes';
            divLikesDate.append(likeWord);
        }

        const likes = document.createElement('p');
        likes.innerHTML = post.likes_number;
        likes.className = "likes-number";

        const datetime = document.createElement('p');
        datetime.innerHTML = post.datetime;
        datetime.className = "datetime";

        divLikesDate.append(likes, datetime);



        if(posts.user_logged == post.writer) {
            const btnEdit = document.createElement('button');
            btnEdit.innerHTML = 'Edit';
            btnEdit.className = 'btn btn-primary edit';
            btnEdit.addEventListener('click', editPost, false);

            
            
            const textarea = document.createElement('textarea');
            textarea.value = post.content;
            textarea.id = 'content-textarea';

            const btnSave = document.createElement('button');
            btnSave.innerHTML = 'Save'
            btnSave.className = 'btn btn-primary'
            btnSave.addEventListener('click', savePost, false);
            const id = document.createElement('span');
            id.innerHTML = post.id;
            id.style.display = 'none';
    
            divTextarea.append(textarea, id, btnSave);
            divTextarea.style.display = 'none';

            divLikesDate.append(btnEdit);

            div.append(divLikesDate);
            
            divPost.append(div, divTextarea);
        }
        else {
            // div.append(writer, content, divLikesDate);
            div.append(divLikesDate);
            divPost.append(div);
        }

        // appending everything to the html posts-container        
        document.querySelector('#posts-container').append(divPost);
 
    })

    nextBackBtns = document.createElement('div');
    nextBackBtns.className = 'next-back-container';
    document.querySelector('#posts-container').append(nextBackBtns);
    
    if (posts.previous_page) {
        const previous = document.createElement('button');
        previous.innerHTML = 'Back';
        previous.className = 'btn btn-primary btn-back';
        previous.addEventListener('click', () => previousPage(postbox, posts.start));
        // document.querySelector('.next-back-container').append(previous);
        nextBackBtns.append(previous);
    }

    if (posts.next_page) {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = 'Next';
        nextBtn.addEventListener('click', () => nextPage(postbox, posts.start));
        nextBtn.className = 'btn btn-primary btn-next-js';
        // document.querySelector('#next-back-container').append(nextBtn);
        
        if (!posts.previous_page) {
            nextBtn.className = 'btn btn-primary';
            nextBtn.id = 'btn-next';
        }
        nextBackBtns.append(nextBtn);
    }
    
}

function nextPage(postbox, start) {
   
    let counter = start;
    const quantity = 10;

    let beginning = counter + quantity;
    let end = beginning + 9;
    
    fetchPosts(postbox, beginning, end);   
}

function previousPage(postbox, start) {
    const endPreviousPage = start;
    const startPreviousPage = endPreviousPage - 10;

    fetchPosts(postbox, startPreviousPage, endPreviousPage);
}

// Function provided by Django to acquire the token
// https://docs.djangoproject.com/en/3.1/ref/csrf/

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
