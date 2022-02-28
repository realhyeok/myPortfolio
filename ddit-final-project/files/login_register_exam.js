// 현재 페이지에서 다른 페이지로 넘어갈 때 표시해주는 기능
window.onbeforeunload = function () { 
	$('#loading').show(); 
} 
// 페이지가 로드 되면 로딩 화면을 없애주는 기능
window.onload = function () {          
  $('#loading').hide();
};
        
$(document).ready(function () {
  if (getCookie("rememberId")) {
    // getCookie함수로 rememberId라는 이름의 쿠키를 불러와서 있을 경우
    // input name이 userEmail인 곳에 getCookie("rememberId")값을 넣어줌
    document.loginForm.userEmail.value = getCookie("rememberId");
    document.loginForm.rememberMe.checked = true;
  }

  // error js
  (function ($) {
    $(".alert .close ").click(function () {
      $(this).parent().fadeOut();
    });
  })(jQuery);
});

$('#login-form').submit(function (e) { 
	e.preventDefault();
	input_email = $('#userEmail').val();
	input_pwd = $('#userPwd').val();

//	  empty id input
	if(input_email == ""){
			$('.alert--error > ul > li:eq(0)').html("<span><strong>아이디</strong>를 입력해 주세요.</span>");
			document.getElementById('userEmail').focus();
			$('.alert--error').show();
			return false;
	 }
	
//	  이메일 형식이 아닐 경우
	if(!isEmail(input_email)){
		$('.alert--error > ul > li:eq(0)').html("<span><strong>이메일</strong>형식이 아닙니다.</span>");
			document.getElementById('userEmail').focus();
			$('.alert--error').show();
			return false;
	}
	
//	  empty pwd input
	if(input_pwd == ""){
			$('.alert--error > ul > li:eq(0)').html("<span><strong>비밀번호</strong>를 입력해 주세요.</span>");
			document.getElementById('userPwd').focus();
			$('.alert--error').show();
			return false;
	 }
	 rememberId();

	 $.ajax({
		 type: "POST",
		 url: "/home/login.do",
		 data: {
			 "input_email" : input_email,
			 "input_pwd" : input_pwd
		 },
		 dataType: "json",
		 success: function (res) {
//			아이디 또는 비밀번호를 잘못 입력하였을 경우
			 if(res.login_fail === "login_fail"){
				 $('.alert--error > ul > li:eq(0)').html("<span>아이디 또는 비밀번호가 잘못 입력 되었습니다.<br/><strong>아이디</strong>와 <strong>비밀번호</strong>를 정확히 입력해 주세요.</span>");
				 $('.alert--error').show();
				 return false;
			 }
//			 이메일 인증을 거치지 않았을 경우
			 if(res.authStatus === "fail"){
				 $('.alert--error > ul > li:eq(0)').html("<span>해당 계정은 <strong>이메일</strong>인증이 확인되지 않습니다.<br/> 이메일을 확인해 주세요.</span>");
				 $('.alert--error').show();
				 return false;
			 }
//			이용플랜 사용 기한이 만료되었을 경우
			 if(res.expired === "expired"){
				 $('.alert--error > ul > li:eq(0)').html("<span><strong>이용 기한</strong>이 만료되어 사용하실 수 없습니다.</span>");
				 $('.alert--error').show();
				 return false;
			 }
//			성공하면 app/index로 페이지 이동
			 if(res.success === "success"){
				 $('.alert--error').hide();
				 location.href="/app/index";
				 return false;
			 }
		 },
		 error: function (err) {
			 console.log("로그인 버튼 클릭 에러 : " + err.status);
		 }
	 });
});


// 아이디 기억하기 (쿠키 이용) 

function setCookie(name, value, expiredays) { //쿠키 저장함수
		var todayDate = new Date();
		todayDate.setDate(todayDate.getDate() + expiredays);
		document.cookie = name + "=" + escape(value) + "; path=/; expires="
						+ todayDate.toGMTString() + ";"
}

function getCookie(Name) { // 쿠키 불러오는 함수
	var search = Name + "=";
	if (document.cookie.length > 0) { // if there are any cookies
			offset = document.cookie.indexOf(search);
			if (offset != -1) { // if cookie exists
					offset += search.length; // set index of beginning of value
					end = document.cookie.indexOf(";", offset); // set index of end of cookie value
					if (end == -1)
							end = document.cookie.length;
					return unescape(document.cookie.substring(offset, end));
			}
	}
}

function rememberId() {
	
	if(document.loginForm.rememberMe.checked == true){ // 아이디 저장을 체크 하였을 경우
		setCookie("rememberId", document.loginForm.userEmail.value, 7);
	} else { // 아이디 저장을 체크하지 않았을 경우
		setCookie("rememberId" , document.loginForm.userEmail.value, 0); // 날짜를 0으로 저장하여 쿠키 삭제
	}
}

// 아이디 기억하기 (쿠키 이용) 끝 
	

/*----------------------------------------- REGISTRATION JS -----------------------------------------*/
const form = document.getElementById('register-form');
const username = document.getElementById('username');
const email = document.getElementById('email');
const pass = document.getElementById('pass');
const re_pass = document.getElementById('re_pass');
const agree_term = document.getElementById('agree-term');

$('#register-form').submit(function (e) { 
	e.preventDefault();
	checkInputs();
  if(!checkInputError()){
    return false;
  }
	$('#loading').show(); 
  $.ajax({
	    type: "POST",
	    url: "/home/register.do",
	    data: $("#register-form").serialize(),
	    dataType: "json",
	    success: function (res) {
				$('#loading').hide();
	    	if(res.idCheck === "false") { setErrorFor(email, '이미 가입된 이메일입니다.'); return false; }
	    	if(res.nicknameCheck === "false"){ setErrorFor(username, '중복된 닉네임을 사용할 수 없습니다.'); return false; }
	    	else {
//	    		console.log("res가 성공으로 넘어왔습니다~!!!");
	    		location.href="/home/login";
	    	}
	    },
	    error: function (err) {
	      console.log("회원가입 유효성 검사 이후 클릭 시 에러 상태 : " + err.status);
	    }
	  });
});

function setErrorFor(input, message) {
	const formControl = input.parentElement;
	const small = formControl.querySelector('small');
	formControl.className = 'form-group custom-validate error';
	small.innerText = message;
}

function setSuccessFor(input) {
	const formControl = input.parentElement;
	formControl.className = 'form-group custom-validate success';
}
	
function checkInputs() {
	// trim to remove the whitespaces
	const usernameValue = username.value.trim();
	const emailValue = email.value.trim();
	const passValue = pass.value.trim();
	const re_passValue = re_pass.value.trim();
	
	if(usernameValue === "") {
		setErrorFor(username, '닉네임을 입력하세요.');
	}else if (!isName(usernameValue)) {
		setErrorFor(username, '닉네임은 한글, 영문, 숫자만 가능하며 2~8자리까지 가능합니다.');
	} else {
		setSuccessFor(username);
	}
	
	if(emailValue === "") {
		setErrorFor(email, '이메일을 입력하세요.');
	} else if (!isEmail(emailValue)) {
		setErrorFor(email, '유효하지 않는 이메일 형식입니다.');
	} else {
		setSuccessFor(email);
	}
	
	if(passValue === '') {
		setErrorFor(pass, '비밀번호를 입력하세요.');
	} else if (!isPwd(passValue)) {
		setErrorFor(pass, '8~16자 영문 대 소문자, 숫자, 특수문자를 사용하세요.');
	}  else {
		setSuccessFor(pass);
	}
	
	if(re_passValue === '') {
		setErrorFor(re_pass, '비밀번호 재확인을 입력하세요.');
	} else if(passValue !== re_passValue) {
		setErrorFor(re_pass, '비밀번호와 일치하지 않습니다.');
	} else{
		setSuccessFor(re_pass);
	}
	
	// if(!agree_term.checked){
	// 	$('.label-agree-term').css('border-bottom', '1px solid red');
	// 	setErrorFor(agree_term, "이용약관에 체크해 주세요.");
	// }else {
	// 	$('.label-agree-term').css('border', 'none');
	// 	setSuccessFor(agree_term);
	// }
}


function checkInputError() {
	  let checkError = true;
	  
	  for (let i = 0; i < $('#register-form div').length; i++) {
	    // console.log(i+"번쨰 => " + $('#register-form div:eq('+i+')').attr('class'));
	    let temp = $('#register-form div:eq('+i+')').attr('class');
	    if(temp === "form-group custom-validate error"){
	      checkError = false;
	    }
	  }
	  
	  return checkError;
}


function isEmail(email) {
	return /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/.test(email);
}
function isPwd(pass) {
  return /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(pass);  
}
function isName(username) {
  return /^(?=.*[a-zA-Z0-9가-힣])[a-zA-Z0-9가-힣]{2,8}$/.test(username);
}

/*----------------------------------------- PASSWORD RESET JS -----------------------------------------*/

// 이메일로 보내기는 등록 폼
$("#send_pwdReset_form").submit(function (e) { 
	e.preventDefault();
	let emailVal = email.value.trim();

	if(emailVal === "") {
		setErrorFor(email, '이메일을 입력하세요.');
	} else if (!isEmail(emailVal)) {
		setErrorFor(email, '유효하지 않는 이메일 형식입니다.');
	} else {
		setSuccessFor(email);
	}

	let temp = $("#send_pwdReset_form div").attr("class");
	if(temp === "form-group custom-validate error"){
		return false;
	}

	let resetFrm = document.send_pwdReset_form;
	
	resetFrm.method = "post";
	resetFrm.action = "/home/send_pwdReset.do";
	resetFrm.submit();
});

// 비밀번호 재설정 등록 폼
$("#password_reset_form").submit(function (e) { 
	e.preventDefault();
	let passValue = pass.value.trim();
	let re_passValue = re_pass.value.trim();

	if(passValue === '') {
		setErrorFor(pass, '비밀번호를 입력하세요.');
	} else if (!isPwd(passValue)) {
		setErrorFor(pass, '8~16자 영문 대 소문자, 숫자, 특수문자를 사용하세요.');
	}  else {
		setSuccessFor(pass);
	}
	
	if(re_passValue === '') {
		setErrorFor(re_pass, '비밀번호 재확인을 입력하세요.');
	} else if(passValue !== re_passValue) {
		setErrorFor(re_pass, '비밀번호와 일치하지 않습니다.');
	} else{
		setSuccessFor(re_pass);
	}
	
	for (let i = 0; i < $('#password_reset_form div').length; i++) {
		let temp = $('#password_reset_form div:eq('+i+')').attr('class');
		if(temp === "form-group custom-validate error"){
			return false;
		}
	}

	let resetFrm = document.password_reset_form;

	resetFrm.method = "post";
	resetFrm.action = "/home/password_reset.do";
	resetFrm.submit();
});


/*----------------------------------------- WELCOME JS -----------------------------------------*/

const canvasEl = document.querySelector('#canvas');

const w = canvasEl.width = window.innerWidth;
const h = canvasEl.height = window.innerHeight * 2;

function loop() {
  requestAnimationFrame(loop);
	ctx.clearRect(0,0,w,h);
  
  confs.forEach((conf) => {
    conf.update();
    conf.draw();
  })
}

function Confetti () {
  //construct confetti
  const colours = ['#fde132', '#009bde', '#ff6b00'];
  
  this.x = Math.round(Math.random() * w);
  this.y = Math.round(Math.random() * h)-(h/2);
  this.rotation = Math.random()*360;

  const size = Math.random()*(w/60);
  this.size = size < 15 ? 15 : size;

  this.color = colours[Math.floor(colours.length * Math.random())];

  this.speed = this.size/7; 

  this.shiftDirection = Math.random() > 0.5 ? 1 : -1;
}

Confetti.prototype.border = function() {
  if (this.y >= h) {
    this.y = h;
  }
}

Confetti.prototype.update = function() {
  this.y += this.speed;
  
  if (this.y <= h) {
    this.x += this.shiftDirection/3;
    this.rotation += this.shiftDirection*this.speed/100;
  }

  if (this.y > h) this.border();
};

Confetti.prototype.draw = function() {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, this.rotation, this.rotation+(Math.PI/2));
  ctx.lineTo(this.x, this.y);
  ctx.closePath();
  ctx.globalAlpha = this.opacity;
  ctx.fillStyle = this.color;
  ctx.fill();
};

const ctx = canvasEl.getContext('2d');
const confNum = Math.floor(w / 4);
const confs = new Array(confNum).fill().map(_ => new Confetti());

loop();


////////////////////////////////!!!!! 카카오 로그인 !!!!!///////////////////////////////////

//SDK를 초기화 합니다. 사용할 앱의 JavaScript 키를 설정해 주세요.
//Kakao.init("582c43c5379e1cd6033238a735875c5f");
//SDK 초기화 여부를 판단합니다.
//console.log(Kakao.isInitialized());

//로그인
//function kakaoLogin() {
//Kakao.Auth.login({
//success: function (authObj) {
// 
// // 로그인 성공시, api를 호출합니다.
// Kakao.API.request({
//   url: "/v2/user/me",
//
//   success: function (resp) { 
//     let kakao_account = resp.kakao_account;
//     let properties = resp.properties;
//
//     let memEmail = "";
//     let memNm = "";
//     let memImgUrl = "";
//     if (typeof kakao_account != "undefined") {
//       // 변수에 속성 값 넣기
//       memEmail = kakao_account.email;
//       memNm = properties.nickname;
//       memImgUrl = properties.profile_image;
////       alert(memImg);
//     }
//
//     $.ajax({
//       url: "/externalLogin.do",
//       data: {
//         "memEmail": memEmail,
//         "memNm": memNm,
//         "memImgUrl" : memImgUrl
//       },
//       type: "post",
//       dataType: "json",
//       success: function (resp) {
//      	 if (resp.flag == "true") {
//               location.href = "/app/index";
//             }
//       },
//       error: function (xhr) {
//         alert("외부 로그인 api 에러 상태 : " + xhr.status);
//       },
//     });
//   },
//
//   fail: function (error) {
//     console.log("error : " + error);
//   },
// });
//},
//fail: function (err) {
// alert(JSON.stringify(err));
//},
//});


//로그아웃
//function kakaoLogout() {
//	if (Kakao.Auth.getAccessToken()) {
//	 Kakao.API.request({
//	   url: "/v1/user/unlink",
//	   success: function (resp) {
//	     location.href="/home/login";
//	   },
//	   fail: function (error) {
//	     console.log("error : " + error);
//	   },
//	 });
//	 Kakao.Auth.setAccessToken(undefined);
//	}
//}
////////////////////////////////!!!!! 네이버 로그인 !!!!!///////////////////////////////////
//function naverLogin(){
//	var naver_id_login = new naverIdLogin("zFXzPH5MbhIUJpBcUHID", "http://localhost/home/login");
//	var state = naver_id_login.getUniqState();
//	naver_id_login.setButton("green", 1,40);
//	naver_id_login.setDomain("http://localhost");
//	naver_id_login.setState(state);
//	naver_id_login.setPopup();
//	naver_id_login.init_naver_id_login();
//}
