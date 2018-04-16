var browser = navigator.userAgent.toLowerCase();
var mobile = browser.indexOf("mobile")>-1 ? true : false;
if(mobile) {
	$(".icon").css({"visibility":"visible"});
}


$( document ).ready(function() {

	$("#tech-used .card").hover(function(e) {
		$(this).find(".techPercent").show().html("");
		var bar = new ProgressBar.Circle("#"+$(this).find(".techPercent").attr("id"), {
		  color: '#FFEA82',
		  trailColor: '#eee',
		  trailWidth: 1,
		  duration: 1400,
		  easing: 'bounce',
		  strokeWidth: 6,
		  from: {color: '#FFEA82', a:0},
		  to: {color: '#ED6A5A', a:1},
		  // Set default step function for all animate calls
		  step: function(state, circle) {
		    circle.path.setAttribute('stroke', state.color);
	        var value = Math.round(circle.value() * 100);
		    if (value === 0) {
		      circle.setText('');
		    } else {
		      circle.setText(value);
		    }
		  }
		});
		bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
		bar.text.style.fontSize = '5rem';
		bar.animate(0.7);  // Number from 0.0 to 1.0
	},
	function(e) {
		$(this).find(".techPercent").hide();
	});

	document.getElementById("defaultOpen").click();

	$(".modal-body #signin input").focus(function(e) {
		if(!$(this).val()) { 
		    $(this).attr("placeholder", "");
		}
		$(this).css({"border-color": "transparent"});
		$(this).next(".inner").show().css({"width": "100%", "border-radius": "12px"});
	}).focusout(function(e) {
		$(this).css({"border-color": "transparent transparent #ccc transparent"});
		$(this).next(".inner").hide().css({"width": "0%", "border-radius": "0px"});
	});

    $(".nav-item").hover(function() {
	  $(this).find(".icon").css({"visibility":"visible"});
	},
	function() {
	  $(this).find(".icon").css({"visibility":"hidden"});
	});

	window.onscroll = function() {
	  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
	  if(winScroll > parseInt($("header").css("height"))-50) {
	  	$("nav").css({"position": "fixed", "top": "0px", "background-color": "#343a40", "width": "100%", "z-index": "16"});
	  }
	  else {
	  	$("nav").css({"position": "relative", "background-color": "transparent", "width": "100%", "z-index": "16"});
	  }
	  if (winScroll > 60) {
	  	document.getElementById("myBar").style.visibility = "visible";
	  }
	  else {
	  	document.getElementById("myBar").style.visibility = "hidden";
	  }
	  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	  var scrolled = (winScroll / height) * 100;
	  document.getElementById("myBar").style.width = scrolled + "%";
	};
});

(function() {
  'use strict';
  window.addEventListener('load', function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();

function openTab(evt, tab) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    evt.currentTarget.className += " active";
    $(".tablinks").css("border-color", "#ccc");
    evt.currentTarget.style.borderColor = "#02ccba #02ccba transparent #02ccba";
    if(tab == "signin") {
    	
    	$("#defaultClose").css({"border-bottom-color": "#02ccba"});
    }
    else {
    	$("#defaultOpen").css({"border-bottom-color": "#02ccba"});
    }
    $(".tabcontent").css({"border-color": "#ccc"});
    $("#"+tab).css({"border-color": "#02ccba"});
} 

;(function(){
          function id(v){ return document.getElementById(v); }
          function loadbar() {
            var ovrl = id("overlay"),
                prog = id("progress"),
                stat = id("progstat"),
                img = document.images,
                c = 0,
                tot = img.length;
            if(tot == 0) return doneLoading();

            function imgLoaded(){
              c += 1;
              var perc = ((100/tot*c) << 0) +"%";
              prog.style.width = perc;
              stat.innerHTML = "Loading "+ perc;
              if(c===tot) return doneLoading();
            }
            function doneLoading(){
              ovrl.style.opacity = 0;
              setTimeout(function(){ 
                ovrl.style.display = "none";
              }, 1200);
            }
            for(var i=0; i<tot; i++) {
              var tImg     = new Image();
              tImg.onload  = imgLoaded;
              tImg.onerror = imgLoaded;
              tImg.src     = img[i].src;
            }    
          }
          document.addEventListener('DOMContentLoaded', loadbar, false);
        }());