const form = document.querySelector("form"),
        nextBtn = form ? form.querySelector(".nextBtn") : null,
        backBtn = form ? form.querySelector(".backBtn") : null;

if(nextBtn){
    const allInput = form.querySelectorAll(".first input");
    nextBtn.addEventListener("click", ()=> {
        allInput.forEach(input => {
            if(input.value != ""){
                form.classList.add('secActive');
            }else{
                form.classList.remove('secActive');
            }
        })
    });
}

if(backBtn){
    backBtn.addEventListener("click", () => form.classList.remove('secActive'));
}
