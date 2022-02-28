// 현재 페이지에서 다른 페이지로 넘어갈 때 표시해주는 기능
window.onbeforeunload = function () { 
	$('#loading').show(); 
} 
// 페이지가 로드 되면 로딩 화면을 없애주는 기능
window.onload = function () {          
  $('#loading').hide();
};

/*----------------------------------------- javascript for login -----------------------------------------*/
const login_submit_button = document.getElementById('signIn');
const loginFrm = document.getElementById('loginForm');
loginFrm.onsubmit = () => {
	const inputEmail = loginFrm.userEmail.value;
	const inputPwd = loginFrm.userPwd.value;
	const alertErr = document.querySelector('.alert--error > ul > li');

	// 이메일 입력란이 비어있을 경우
	if(inputEmail === ""){
		alertErr.innerHTML = `<span><strong>아이디</strong>를 입력해 주세요.</span>`;
		document.getElementById('userEmail').focus();
		document.querySelector('.alert--error').style.display = 'block';
		return false;
	}
	// 비밀번호 입력란이 비어있을 경우
	if(inputPwd === ""){
		alertErr.innerHTML = `<span><strong>비밀번호</strong>를 입력해 주세요.</span>`;
		document.getElementById('userPwd').focus();
		document.querySelector('.alert--error').style.display = 'block';
		return false;
	}
	// 이메일 형식이 아닐 경우
	if(!isEmail(inputEmail)){
		alertErr.innerHTML = `<span><strong>이메일</strong>형식이 아닙니다.</span>`;
		document.getElementById('userEmail').focus();
		document.querySelector('.alert--error').style.display = 'block';
		return false;
	}
	// 아이디 기억하기 (쿠키 이용)
	if(loginFrm.rememberMe.checked == true){ // 아이디 저장을 체크 하였을 경우
		setCookie("rememberId", inputEmail, 7);
	} else { // 아이디 저장을 체크하지 않았을 경우
		setCookie("rememberId" , inputEmail, 0); // 날짜를 0으로 저장하여 쿠키 삭제
	}

	$.ajax({
		type: "POST",
		url: "/home/login.do",
		data: {
			"input_email" : input_email,
			"input_pwd" : input_pwd
		},
		dataType: "json",
		success: function (res) {
			// 아이디 또는 비밀번호를 잘못 입력하였을 경우
			if(res.login_fail === "login_fail"){
				document.querySelector('.alert--error > ul > li').innerHTML = `<span>아이디 또는 비밀번호가 잘못 입력 되었습니다.<br/><strong>아이디</strong>와 <strong>비밀번호</strong>를 정확히 입력해 주세요.</span>`;
				document.querySelector('.alert--error').style.display = 'block';
				return false;
			}
			// 이메일 인증을 거치지 않았을 경우
			if(res.authStatus === "fail"){
				document.querySelector('.alert--error > ul > li').innerHTML = `<span>해당 계정은 <strong>이메일</strong>인증이 확인되지 않습니다.<br/> 이메일을 확인해 주세요.</span>`;
				document.querySelector('.alert--error').style.display = 'block';
				return false;
			}
			// 이용플랜 사용 기한이 만료되었을 경우
			if(res.expired === "expired"){
				document.querySelector('.alert--error > ul > li').innerHTML = `<span><strong>이용 기한</strong>이 만료되어 사용하실 수 없습니다.</span>`;
				document.querySelector('.alert--error').style.display = 'block';
				return false;
			}
			// 성공하면 app/index로 페이지 이동
			if(res.success === "success"){
				document.querySelector('.alert--error').style.display = '';
				location.href="/app/index";
				return false;
			}
		},
		error: function (err) {
			console.log("로그인 버튼 클릭 에러 : " + err.status);
		}
	});
}

// 아이디 기억하기 (쿠키 이용)
function setCookie(name, value, expiredays) { 
	let todayDate = new Date();
	todayDate.setDate(todayDate.getDate() + expiredays);
	document.cookie = name + "=" + escape(value) + "; path=/; expires="
					+ todayDate.toGMTString() + ";"
}
function getCookie(Name) {
	let search = Name + "=";
	if (document.cookie.length > 0) { 
			offset = document.cookie.indexOf(search);
			if (offset != -1) {
					offset += search.length; 
					end = document.cookie.indexOf(";", offset);
					if (end == -1)
							end = document.cookie.length;
					return unescape(document.cookie.substring(offset, end));
			}
	}
}

// validation function
function isEmail(email) {
	return /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/.test(email);
}
function isPwd(pass) {
  return /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(pass);  
}
function isName(name) {
  return /^(?=.*[a-zA-Z0-9가-힣])[a-zA-Z0-9가-힣]{2,8}$/.test(username);
}


/*----------------------------------------- javascript for register -----------------------------------------*/
const registerFrm = document.getElementById('register-form');
const username = document.getElementById('username');
const email = document.getElementById('email');
const pass = document.getElementById('pass');
const re_pass = document.getElementById("re_pass");
const agree_term = document.getElementById('agree-term');

registerFrm.onsubmit = () => {
	checkInputs();
}

$('#register-form').submit(function (e) { 
	e.preventDefault();
	checkInputs();

	// input 태그들 중, 하나라도 validate error 클래스명이 존재할 경우 빠른 return
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
		let temp = $('#register-form div:eq('+i+')').attr('class');
		if(temp === "form-group custom-validate error"){
			checkError = false;
		}
	}
	
	return checkError;
}


/*----------------------------------------- javascript for reset to password -----------------------------------------*/
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


/*----------------------------------------- javascript for welcome css event -----------------------------------------*/

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
  
  this.opacity = Math.random();

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