const body = document.querySelector("body"),
      modeToggle = body.querySelector(".mode-toggle");
      sidebar = body.querySelector("nav");
      sidebarToggle = body.querySelector(".sidebar-toggle");

let getMode = localStorage.getItem("mode");
if(getMode && getMode ==="dark"){
    body.classList.toggle("dark");
}

let getStatus = localStorage.getItem("status");
if(getStatus && getStatus ==="close"){
    sidebar.classList.toggle("close");
}

modeToggle.addEventListener("click", () =>{
    body.classList.toggle("dark");
    if(body.classList.contains("dark")){
        localStorage.setItem("mode", "dark");
    }else{
        localStorage.setItem("mode", "light");
    }
});

sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
    if(sidebar.classList.contains("close")){
        localStorage.setItem("status", "close");
    }else{
        localStorage.setItem("status", "open");
    }
});

// ---- Section switching ----
function showSection(id) {
    document.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
    var target = document.getElementById(id);
    if(target) target.classList.add('active');
    if(target && window.location.hash !== '#' + id) {
        history.replaceState(null, '', '#' + id);
    }
    // Update nav active state
    document.querySelectorAll('.nav-links li a').forEach(function(a){ a.classList.remove('nav-active'); });
    var navLink = document.getElementById('nav-' + id);
    if(navLink) navLink.classList.add('nav-active');
    // Reset tab states when switching sections
    if(target) {
        var firstTab = target.querySelector('.tab-btn');
        var firstContent = target.querySelector('.tab-content');
        if(firstTab && firstContent) {
            target.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('tab-active'); });
            target.querySelectorAll('.tab-content').forEach(function(tc){ tc.classList.remove('tab-visible'); });
            firstTab.classList.add('tab-active');
            firstContent.classList.add('tab-visible');
        }
    }
}

var initialSection = window.location.hash ? window.location.hash.substring(1) : '';
if(initialSection && document.getElementById(initialSection)) {
    showSection(initialSection);
}

window.addEventListener('hashchange', function(){
    var section = window.location.hash ? window.location.hash.substring(1) : 'overview';
    if(document.getElementById(section)) {
        showSection(section);
    }
});

// ---- Search popup ----
function openSearch(){
    var popup = document.getElementById("popup2");
    popup.classList.remove("scale-out-center");
    popup.classList.add("scale-in-center");
    popup.style.display = "block";
}
function closeSearch(){
    var popup = document.getElementById("popup2");
    popup.classList.remove("scale-in-center");
    popup.classList.add("scale-out-center");
    setTimeout(function(){ popup.style.display = "none"; }, 400);
}
function submitSearch(){
    document.getElementById("s-form").submit();
}
