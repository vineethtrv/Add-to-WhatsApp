const mobileNumberEl = document.getElementById('mobile-number');
const sendBtn = document.getElementById('send-btn');
let wordIndex = 0;
let pctIndex = 0;
// Fid default country code
let mobileNumber = '';
let palceholderTexts = ['Enter Phone Number', 'With Dial Code...' , '91 9876543210'];
// On Keypress
mobileNumberEl.addEventListener('keyup', e=> {

    mobileNumber = e.target.value.replace("+", "").replace(/ /g,'');
    if (mobileNumber.length > 5) {
        sendBtn.removeAttribute('disabled');
        // open whatsApp on enter press 
        if(e.key == "Enter" || e.keyCode == 13){
            openWhatsApp()
        }
    }else{
        sendBtn.setAttribute('disabled' , true);
    }
})


// On send button tap
sendBtn.addEventListener('click' , e => {
    e.preventDefault();
    openWhatsApp();
})

// Open WhatsApp
function openWhatsApp(){
    let url = 'https://wa.me/' + mobileNumber;
    window.open(url, '_blank').focus();
}


// Placeholder Animation
setInterval(()=>{

// Check word length 
if((palceholderTexts[pctIndex].length - 1) >= wordIndex){
    wordIndex++;
} else {
    wordIndex = 0;
    if((palceholderTexts.length - 1)  > pctIndex){
        pctIndex++;
    }else{
        pctIndex = 0;
    }
}
mobileNumberEl.placeholder = palceholderTexts[pctIndex].substr(0, wordIndex);


}, 200 );
