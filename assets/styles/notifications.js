/* ===== Notification Bell Component ===== */
(function(){
    var bell = document.getElementById('notif-bell');
    if(!bell) return;
    
    var badge = bell.querySelector('.notif-badge');
    var dropdown = document.getElementById('notif-dropdown');
    var list = document.getElementById('notif-list');
    
    // Fetch notifications on page load
    fetchNotifications();
    
    // Toggle dropdown
    bell.addEventListener('click', function(e){
        e.stopPropagation();
        dropdown.classList.toggle('open');
        if(dropdown.classList.contains('open')){
            fetchNotifications();
        }
    });
    
    // Close on outside click
    document.addEventListener('click', function(e){
        if(!dropdown.contains(e.target) && e.target !== bell){
            dropdown.classList.remove('open');
        }
    });
    
    function fetchNotifications(){
        fetch('/notifications')
            .then(function(r){ return r.json(); })
            .then(function(data){
                // Update badge
                if(data.unreadCount > 0){
                    badge.textContent = data.unreadCount > 9 ? '9+' : data.unreadCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
                // Render list
                if(data.notifications.length === 0){
                    list.innerHTML = '<div class="notif-empty"><p>No notifications</p></div>';
                    return;
                }
                var html = '';
                for(var i=0; i<data.notifications.length; i++){
                    var n = data.notifications[i];
                    var timeAgo = getTimeAgo(new Date(n.created_at));
                    var iconClass = getIcon(n.type);
                    html += '<div class="notif-item ' + (n.is_read ? '' : 'unread') + '" data-id="' + n.id + '" data-link="' + (n.link || '#') + '">';
                    html += '<div class="notif-icon ' + n.type + '"><i class="uil ' + iconClass + '"></i></div>';
                    html += '<div class="notif-content">';
                    html += '<strong>' + escapeHtml(n.title) + '</strong>';
                    html += '<p>' + escapeHtml(n.message) + '</p>';
                    html += '<span class="notif-time">' + timeAgo + '</span>';
                    html += '</div></div>';
                }
                list.innerHTML = html;
                
                // Attach click handlers
                var items = list.querySelectorAll('.notif-item');
                for(var j=0; j<items.length; j++){
                    items[j].addEventListener('click', function(){
                        var id = this.getAttribute('data-id');
                        var link = this.getAttribute('data-link');
                        // Mark as read
                        fetch('/notifications/read', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({id: id})
                        });
                        if(link && link !== '#') window.location.href = link;
                    });
                }
            })
            .catch(function(err){ console.log('Notification fetch error:', err); });
    }
    
    // Mark all as read
    var markAllBtn = document.getElementById('notif-mark-all');
    if(markAllBtn){
        markAllBtn.addEventListener('click', function(e){
            e.stopPropagation();
            fetch('/notifications/read-all', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            }).then(function(){
                badge.style.display = 'none';
                var unreadItems = list.querySelectorAll('.unread');
                for(var i=0; i<unreadItems.length; i++) unreadItems[i].classList.remove('unread');
            });
        });
    }
    
    function getTimeAgo(date){
        var seconds = Math.floor((new Date() - date) / 1000);
        if(seconds < 60) return 'Just now';
        var minutes = Math.floor(seconds / 60);
        if(minutes < 60) return minutes + 'm ago';
        var hours = Math.floor(minutes / 60);
        if(hours < 24) return hours + 'h ago';
        var days = Math.floor(hours / 24);
        if(days < 7) return days + 'd ago';
        return date.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    }
    
    function getIcon(type){
        switch(type){
            case 'approved': return 'uil-check-circle';
            case 'rejected': return 'uil-times-circle';
            case 'new_request': return 'uil-file-edit-alt';
            case 'drive_update': return 'uil-briefcase';
            default: return 'uil-bell';
        }
    }
    
    function escapeHtml(str){
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
