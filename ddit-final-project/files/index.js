
//전역변수 선언-모든 홈페이지에서 사용 할 수 있게 index에 저장

// <!-- 콜라보 none or list로 보내는 함수 -->        
window.addEventListener('load', function () {
  $.ajax({
        type: "post",
        url: "/app/collabo/getCollaboCount",
        success: function (result) {
            // 성공하면 해당 컨트롤러에서 int result을 받아올 것이다.
            if(result > 0){
                $('#OwnCollabo').attr('href', "/app/collabo-list");
                $('#OwnCollabo-tab').attr('href', "/app/collabo-list");
            } else { // 콜라보를 가지고 있지 않은 경우
                $('#OwnCollabo').attr('href', "/app/collabo-none");
                $('#OwnCollabo-tab').attr('href', "/app/collabo-none");
            }
        }
    });
});

$(document).ready(function () {
  connectWs();
  updateAlertList(); // 알림 리스트 갱신
  getListToAsideBar(); // aside바 리스트들 갱신
  if (window.location.pathname === "/app/index") {
    getUserTotalCount(); // 유저 업무, 프로젝트, 이슈, 리퀘스트, 메일 총량 출력
    getUserMaxUploadCapacity();
    getRecentTaskList();
  }
  if (getCookie("allAlertCheckBox")) {
    $("#allAlertCheckBox").prop("checked", true);
  }
  isProjAlertCheckBox();
  writePaymentHistory();
  projectList_for_profile();
  
  if (window.location.pathname === "/app/tag") {
    printTagGrid();
  }
});

var socket = null;
function connectWs(){
  var sock = new WebSocket("ws://localhost/app/**");
  socket = sock;

  sock.onopen = function(e) {
        console.log('info: connection opened.');
  };

  sock.onmessage = function(event) {
  //		console.log("ReceivMessage : " + event.data + "\n");

    let datas = event.data.split(',');
    if(datas != null && datas.length == 6){

        let serderNickName = datas[0];
        let serderWhere = datas[1];
        let senderTarget = datas[2];
        let senderWhatToDo = datas[3];
        let senderProjNo = datas[4];
        let receiverUserId = datas[5];

        var alertData = {
          serderNickName: serderNickName,
          receiverUserId: receiverUserId,
          mailFrom : serderWhere,
          content: "["+ serderWhere +"]\n" + serderNickName + "님이 " + senderTarget + "를(을) " + senderWhatToDo + "했습니다."
        };
        
        if(serderWhere === "채팅"){
          alertData.content = `${serderNickName}님이 ${senderTarget}채팅방으로 회원님을 ${senderWhatToDo}했습니다.`;
        } else if(serderWhere === "메일"){
          alertData.content = `${serderNickName}님이 회원님에게 ${senderTarget}을 ${senderWhatToDo}했습니다.`;
        } else if(serderWhere === "프로젝트" && senderWhatToDo === "초대"){
          alertData.content = `${serderNickName}님이 『${senderTarget}』프로젝트로 회원님을 ${senderWhatToDo}했습니다.`;
        } else if(serderWhere === "프로젝트" && senderWhatToDo === "수락"){
          alertData.content = `${serderNickName}님이 『${senderTarget}』프로젝트 초대를 ${senderWhatToDo}했습니다.`;
        } else if(serderWhere === "콜라보" && senderWhatToDo === "수락"){
          alertData.content = `${serderNickName}님이 콜라보 초대를 ${senderWhatToDo}했습니다.`;
        }

        // 모든 알림 끄기가 켜져있지 않으면 if문이 실행되어 알림을 보낸다!
        if(document.querySelector("#allAlertCheckBox").checked){
          return false;
        } 
        
        toastr.success(alertData.content);
        $.ajax({
            type: "post",
            url: "/app/addToAlertList.do",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            data: JSON.stringify(alertData),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
              add_alert_li(data);
            },
            error: function (err) {
              console.log(this + "에서 알림 전송 실패, 에러 상태 : " + err.status);
            },
        });
      }
  };

  sock.onclose = function() {
    console.log('info: connection closed');
  };
  sock.onerror = function (err) {console.log('Errors : ' , err);};
}

function add_alert_li(alertData) {
  let ul = document.querySelector("#alertVOList");
  const li = document.createElement("li");

  if (document.querySelector("#alertVOList .none-alert")) {
    document.querySelector("#alertVOList .none-alert").remove();
  }
  let alertCount = $("#navbarDropdown1 span.badge.bg-green").html();
  $("span.badge.bg-green").html(parseInt(alertCount) + 1);

  if(alertData.mailFrom === "메일" || alertData.mailFrom === "콜라보" || alertData.mailFrom === "채팅" || alertData.mailFrom === "프로젝트"){
    li.innerHTML = `<li class="nav-item">
            <a class="dropdown-item" href="/app/myWork?mail=mail">
              <span class="image">
                <img src="/user/getPictureByNickname?nickname=${alertData.nickname}" alt="Profile Image" />
              </span>
              <span>
                <span>${alertData.nickname}</span>
                <span class="time">${timeForToday(alertData.writeTime)}</span>
              </span>
              <span class="message">${alertData.content}</span>
            </a>
          </li>`;
  } else {
    li.innerHTML = `<li class="nav-item">
            <a class="dropdown-item">
              <span class="image">
                <img src="/user/getPictureByNickname?nickname=${alertData.nickname}" alt="Profile Image" />
              </span>
              <span>
                <span>${alertData.nickname}</span>
                <span class="time">${timeForToday(alertData.writeTime)}</span>
              </span>
              <span class="message">${alertData.content}</span>
            </a>
          </li>`;
  }
  while (li.children.length > 0) {
    ul.prepend(li.children[0]);
  }
}

function updateAlertList() {
  $.ajax({
  type: "post",
  url: "/app/updateAlertList.do",
  contentType: "application/x-www-form-urlencoded; charset=UTF-8",
  success: function (data) {
    var alertList = data.alertList;
    var alertCount = data.alertCount;

    $('span.badge.bg-green').html(alertCount); // 알림 갯수 카운트 
    let alert_ul = document.querySelector("#alertVOList");
    const li = document.createElement("li");

    if(alertList.length === 0){
      li.innerHTML =`<li class="nav-item none-alert">
                        <strong>해당 내용이 없습니다.</strong>
                      </li>`;
      alert_ul.prepend(li.children[0]);
    }

    alertList.forEach(e => {
      if(e.mailFrom === "메일" || e.mailFrom === "콜라보" || e.mailFrom === "채팅" || e.mailFrom === "프로젝트"){
        li.innerHTML = `<li class="nav-item">
                <a class="dropdown-item" href="/app/myWork?mail=mail">
                  <span class="image">
                    <img src="/user/getPictureByNickname?nickname=${e.nickname}" alt="Profile Image" />
                  </span>
                  <span>
                    <span>${e.nickname}</span>
                    <span class="time">${timeForToday(e.writeTime)}</span>
                  </span>
                  <span class="message">${e.content}</span>
                </a>
              </li>`;
      } else {
        li.innerHTML = `<li class="nav-item">
                        <a class="dropdown-item">
                          <span class="image">
                            <img src="/user/getPictureByNickname?nickname=${e.nickname}" alt="Profile Image" />
                          </span>
                          <span>
                            <span>${e.nickname}</span>
                            <span class="time">${timeForToday(e.writeTime)}</span>
                          </span>
                          <span class="message">${e.content}</span>
                        </a>
                      </li>`;
      }
      while (li.children.length > 0) {
        alert_ul.prepend(li.children[0]);
      }
    });
      
  },
  error: function (err) {
    console.log("updateAlertList err status : " + err.status);
  }
  });
}

function timeForToday(value) {
  const today = new Date();
  const timeValue = new Date(value);

  const betweenTime = Math.floor((today.getTime() - timeValue.getTime()) / 1000 / 60);
  if (betweenTime < 1) return '방금전';
  if (betweenTime < 60) {
      return `${betweenTime}분전`;
  }

  const betweenTimeHour = Math.floor(betweenTime / 60);
  if (betweenTimeHour < 24) {
      return `${betweenTimeHour}시간전`;
  }

  const betweenTimeDay = Math.floor(betweenTime / 60 / 24);
  if (betweenTimeDay < 365) {
      return `${betweenTimeDay}일전`;
  }

  return `${Math.floor(betweenTimeDay / 365)}년전`;
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// 여기서부터 본인의 js파일에 구현해주세요. (개인이 구현해야될 부분)

// 	senderProjNo에 해당 프로젝트 넘버를 넣어주세요. 같은 구성원인지 비교합니다.
//	프로젝트 넘버가 필요없는 알림일 경우, 기본 값으로 0으로 지정합니다. DB의 PROJECT테이블에서 0은 사용하지 않는 상태입니다.
//	whatToDo에 "등록", "수정","삭제"라고만 적어주세요. "~~했습니다"라고 적지 마세요. 나중에 붙여줘야합니다. 
//  아래의 socketData에 들어갈 데이터는 반드시 5개여야합니다. 현재 socketData구조체에서 하나라도 로컬변수가 사라지면 에러납니다.
//  자신의 데이터에 맡게 변수명은 바꿔주세요. 그렇지 않으면 충돌이 일어납니다.
//	
let socketData = {
    nickname : "작성자 닉네임(ex.도전자)",
    where : "메일",
    target : "무엇을 작성햇는지 (ex.라마바 업무)",
    whatToDo : "어떤 CRUD를 했는지(수정/삭제/..)",
    projNo: "0",
    receiverId : "test30@example.com"
};


  $("#doingTest").on("click", function (e) {
    e.preventDefault();

    
    if (socket) {
//    	  protocol : 누가(nickname) 어디서(분야) 무엇(target)을 curd(어떻게), 프로젝트 넘버
//    	  ","를 구분자로 분리합니다. 반드시 위처럼 순서대로 작성해주세요.
        let socketMsg = socketData.nickname 
                + "," + socketData.where 
                + "," + socketData.target 
                + "," + socketData.whatToDo 
                + "," + socketData.projNo
                + "," + socketData.receiverId;
        
//        send()하게 되면 alert에 있는 AlertHandler의 handleTextMessage() 메서드로 파라미터를 전달하게 됩니다.
        socket.send(socketMsg);
      }

  });
//////////////////////////////////////////////////////////////////////////////////////////////////
// 개인용

function getUserTotalCount(){
let taskTotalCount = document.querySelector('.dash-board-boxes .dashboard-stat .details .taskTotalCount');
let issueTotalCount = document.querySelector('.dash-board-boxes .dashboard-stat .details .issueTotalCount');
let mailTotalCount = document.querySelector('.dash-board-boxes .dashboard-stat .details .mailTotalCount');
let collaboTotalCount = document.querySelector('.dash-board-boxes .dashboard-stat .details .collaboTotalCount');
let projectTotalCount = document.querySelector('.dash-board-boxes .dashboard-stat .details .projectTotalCount');

  $.ajax({
    type: "get",
    url: "/getUserTotalCount.do",
    success: function (res) {
      taskTotalCount.innerHTML = res.taskCount;
      issueTotalCount.innerHTML = res.issueCount;
      mailTotalCount.innerHTML = res.mailCount;
      collaboTotalCount.innerHTML = res.collaboCount;
      projectTotalCount.innerHTML = res.projectCount;
    },
    error: function (err) {
      console.log("getUserTotalCount() err status : " + err.status);
    }
  });
}
  
// aside에 있는 리스트를 비동기로 실시간 갱신하여 출력한다.
function getListToAsideBar() {
  $.ajax({
    type: "post",
    url: "/app/getListToAsideBar.do",
    success: function (resp) {
      let taskList = resp.taskList;
      let projectList = resp.projectList;
      let collaboList = resp.collaboList;

      showAsideBarList(taskList, projectList, collaboList);
      if(window.location.pathname === "/app/index"){
        monthProjectGraph(projectList);
        task_list_for_index_page(taskList);
        project_list_for_index_page(projectList);
      }
    },error: function (err) {
      console.log("getTaskListToAsideBar() err status : " + err.status);
    }
  });
}

// aside바에 존재하는 리스트를 갱신해준다.
function showAsideBarList(taskList, projectList, collaboList) {
let project_list_ul = document.querySelector(".user_project_list");
let collabo_list_ul = document.querySelector(".user_collabo_list");
const li = document.createElement("li");

// 업무 리스트 조회
// let task_list_ul = document.querySelector(".user_task_list");
// if(taskList.length === 0){
// 	li.innerHTML = `<li><a href="#">참여중인 업무가 존재하지 않습니다.</a></li>`;
// 	task_list_ul.prepend(li.children[0]);
// } else {
// 	taskList.forEach(e => {
// 		li.innerHTML = `<li><a href="">${e.title}</a></li>`;
// 		while (li.children.length > 0) {
// 			task_list_ul.prepend(li.children[0]);
// 		}
// 	});
// }

// 프로젝트 리스트 조회
if(projectList.length === 0){
  li.innerHTML = `<li><a href="#">참여중인 프로젝트가 존재하지 않습니다.</a></li>`;
  project_list_ul.prepend(li.children[0]);
} else {
  projectList.forEach(e => {
    li.innerHTML = `<li><a href="/app/project/main?projNo=${e.projNo}">${e.title}</a></li>`;
    while (li.children.length > 0) {
      project_list_ul.prepend(li.children[0]);
    }
  });
}

// 콜라보 리스트 조회
if(collaboList.length === 0){
  li.innerHTML = `<li><a href="#">참여중인 콜라보가 존재하지 않습니다.</a></li>`;
  collabo_list_ul.prepend(li.children[0]);
} else {
  collaboList.forEach(e => {
    li.innerHTML = `<li><a href="/app/collabo/main?cprojNo=${e.cprojNo}">${e.title}</a></li>`;
    while (li.children.length > 0) {
      collabo_list_ul.prepend(li.children[0]);
    }
  });
}

getAlertModalProjectList(projectList);
}

// 알림설정에 프로젝트 리스트 가져오는 메서드
function getAlertModalProjectList(projectList) {

let modalList = document.querySelector("#projectAlertSettingList");
const li = document.createElement("li");

if(projectList.length === 0){
  li.innerHTML = 	`<li><div class="form-group row">
                      <div class="col-lg-12">
                        <h5>참여중인 프로젝트가 없습니다.</h5>
                      </div>
                    </div></li>`;
  modalList.append(li.children[0]);

} else {
  projectList.forEach(e => {
    li.innerHTML = 	`<li><div class="form-group row">
                        <div class="col-lg-12">
                          <label class="switch float-right"> <input type="checkbox" projNo="${e.projNo}" onchange="settingProjListAlert();">
                            <span class="slider round"></span>
                          </label> <i class="fa fa-desktop fa-2x" style="float: left;"></i>
                          <h5>&nbsp;${e.title}</h5>
                        </div>
                      </div></li>`;
    while (li.children.length > 0) {
      modalList.append(li.children[0]);
    }
  });
}
}

// 모든 알림 끄기 버튼을 활성화하면 쿠키에 저장하는 메서드
function settingAllAlert() {
let allChk = document.querySelector("#allAlertCheckBox").checked;
console.log("chk = >" + allChk);
if(allChk){
  setCookie("allAlertCheckBox", allChk, 3);
} else {
  setCookie("allAlertCheckBox", allChk, 0);
}
}

function isProjAlertCheckBox(){
if(getCookie("projAlertCheckBox")){
  let chkArr =getCookie("projAlertCheckBox").split(",");

  // let parent = document.getElementById("projectAlertSettingList");
  // 모달에 있는 #projectAlertSettingList를 불러오지 못하고 있다.
  let modalList = $("#projectAlertSettingList li");
  console.log(modalList.length);

  for (let i = 0; i < chkArr.length; i++) {
    let li_checkbox = $("#projectAlertSettingList").find("li:eq("+i+")").attr("projno");
    console.log("li_checkbox => " + li_checkbox);
    console.log("chkArr[i] => " + chkArr[i]);
    // $(li_checkbox).prop('checked', true);
  }
}
}

// 프로젝트별 알림 끄기 버튼을 활성화하면 쿠키에 저장하는 메서드
function settingProjListAlert(){
let modalList = $("#projectAlertSettingList li");
let checkArr = [];
let flag = false;

for (let i = 0; i < modalList.length; i++) {
  let li_checkbox = $("#projectAlertSettingList li:eq("+i+") input[type=checkbox]");
  let li_chk = li_checkbox.is(':checked');
  console.log("test => " + li_checkbox.attr('projno'));
  console.log("check => " + li_chk);
  checkArr.push(li_chk);

  if(li_checkbox){ 
    // 프로젝트 리스트 알림 끄기가 하나라도 켜져 있다면 flag = true;
    // flag = false이면 쿠키 삭제
    flag = true;
  }
}

if(flag){
  setCookie("projAlertCheckBox", checkArr, 3);
} else {
  setCookie("projAlertCheckBox", checkArr, 0);
}
}

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

function task_list_for_index_page(taskList) {

const tbody = document.querySelector(".task_list_for_index_page");

if(taskList.length === 0){
  tbody.innerHTML = `<tr>
                    <td colspan="3">참여중인 업무가 존재하지 않습니다.</td>
                  </tr>`;
  // tbody.append(tr.children[0]);
} else {
  let cnt = 0;
  taskList.forEach(e => {
    if(cnt >= 3){ 
      return false;
    }
    if(e.status != "완료" && e.projNo != null){
      tbody.innerHTML += `<tr>
                        <td scope="row" class="text-truncate" style="max-width: 150px;">${e.title}</td>
                        <td class="text-truncate" style="max-width: 60px;">${e.projNo}</td>
                        <td>${e.status}</td>
                      </tr>`;
      cnt++;
    }
  });
}
}

function project_list_for_index_page(projectList) {

const tbody = document.querySelector(".project_list_for_index_page");

if(projectList.length === 0){
  tbody.innerHTML = `<tr>
                      <td colspan="3">참여중인 프로젝트가 존재하지 않습니다.</td>
                    </tr>`;
} else {
  let cnt = 0;
  projectList.forEach(e => {


    if(cnt >= 3){ 
      return false;
    }

    $.ajax({
      type: "get",
      url: "/app/task/getTaskListByProjNo",
      data: {"projNo" : e.projNo},
      success: function (res) {
        let advancement = 0;
        let projTaskCount = 0;
        res.forEach(taskEle => {
          if(taskEle.status === "B204"){ // 완료일 경우
            advancement++;
          }
          projTaskCount++;
        });
        let achievementPercent = (advancement / projTaskCount) * 100;
        if(isNaN(achievementPercent)){
          achievementPercent = 0;
        }
        tbody.innerHTML += `<tr>
                          <td scope="row" class="text-truncate" style="max-width: 150px;">${e.title}</td>
                          <td>${e.status}</td>
                          <td>${dateFormat(new Date(e.startdate))}</td>
                          <td>${dateFormat(new Date(e.enddate))}</td>
                          <td class="vertical-align-mid">
                            <div class="progress" title="${Math.floor(achievementPercent)}%">
                              <div class="progress-bar progress-bar-success" data-transitiongoal="${Math.floor(achievementPercent)}" style="width: ${Math.floor(achievementPercent)}%;" aria-valuenow="${Math.floor(achievementPercent)}"></div>
                            </div>
                          </td>
                        </tr>`;
      },
      error: function (err) {
        console.log("project_list_for_index_page() err status : " + err.status);
      }
    });

    cnt++;
  });
}
}

function dateFormat(date) {
let year = date.getFullYear();
let month = (1 + date.getMonth());
month = month >= 10 ? month : '0' + month;
let day = date.getDate();
day = day >= 10 ? day : '0' + day;
return year + '-' + month + '-' + day;
}

function projectList_for_profile() {
if(window.location.pathname === "/user/profile"){
  
  let search = location.search
  let params = new URLSearchParams(search);
  let getType= params.get('userId');

  console.log("getType => " + getType);

  $.ajax({
    type: "get",
    url: "/app/project/getProjectListByParamUserId",
    data: {"userId" : getType},
    dataType:"json",
    success: function (res) {
      print_projects_for_profile(res);
    },
    error: function (err) {
      console.log("projectList_for_profile() err status : " + err.status);
    }
  });

  
}

function print_projects_for_profile(projectList){

  const tbody = document.querySelector(".profile_projectList");

  console.log("len => " + projectList.length);
  if(projectList.length === 0){
    tbody.innerHTML = `<tr>
                        <td colspan="4">활동중인 프로젝트가 존재하지 않습니다.</td>
                      </tr>`;
  } else {
    projectList.forEach(e => {
      console.log("e = > " + e);

      if(e.privacy === "공개"){ // 공개인 프로젝트만 출력

        $.ajax({
          type: "get",
          url: "/app/task/getTaskListByProjNo",
          data: {"projNo" : e.projNo},
          success: function (res) {

            console.log("res = > " + res);

            let advancement = 0;
            let projTaskCount = 0;
            res.forEach(taskEle => {
              if(taskEle.status === "B204"){ // 완료일 경우
                advancement++;
              }
              projTaskCount++;
            });
            let achievementPercent = (advancement / projTaskCount) * 100;
            if(isNaN(achievementPercent)){
              achievementPercent = 0;
            }
            tbody.innerHTML += `<tr style="cursor: pointer;" onclick="location.href='/app/project/main?projNo=${e.projNo}&from=search'">
                                  <td scope="row" class="text-truncate" style="max-width: 150px;">${e.title}</td>
                                  <td>${e.status}</td>
                                  <td>${projTaskCount}</td>
                                  <td class="vertical-align-mid">
                                    <div class="progress" title="${Math.floor(achievementPercent)}%">
                                      <div class="progress-bar progress-bar-success" data-transitiongoal="${Math.floor(achievementPercent)}" style="width: ${Math.floor(achievementPercent)}%;" aria-valuenow="${Math.floor(achievementPercent)}"></div>
                                    </div>
                                  </td>
                                </tr>`;
          },
          error: function (err) {
            console.log("projectList_for_profile() err status : " + err.status);
          }
        });
      }
    });
  }
}
}


////////////////////////////////////////////////////////////////////////////////////
// custom graph

// 월별 그래프 차트 출력 메서드
function monthProjectGraph(projectList) {

  var test_data_bar = {
    type: "bar",
    data: {
      labels: [
        "1월",
        "2월",
        "3월",
        "4월",
        "5월",
        "6월",
        "7월",
        "8월",
        "9월",
        "10월",
        "11월",
        "12월",
      ],
      datasets: [
        {
          label: "진행중",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgb(75, 192, 192)",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderWidth: 1,
        },
        {
          label: "지연",
          backgroundColor: "rgba(255, 205, 86, 0.2)",
          borderColor: "rgb(255, 205, 86)",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderWidth: 1,
        },
        {
          label: "완료",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgb(54, 162, 235)",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderWidth: 1,
        },
        {
          label: "파기요청",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          stacked: true,
        },
        x: {
          stacked: true,
        },
      },
    },
  };

  let dataset = test_data_bar.data.datasets;
  let labels = test_data_bar.data.labels;
  projectList.forEach((project) => {
    let startMonth = new Date(project.startdate).getMonth() + 1;
    let endMonth = new Date(project.enddate).getMonth() + 1;
    let thisYear = new Date().getFullYear();
    let projEndYear = new Date(project.enddate).getFullYear();

    endMonth = startMonth == endMonth ? endMonth + 1 : endMonth;

    if (projEndYear < thisYear) { return false; }

    // 마감 년도가 올해 년도보다 크다면 올해 월별 차트는 시작월부터 12월까지 출력.
    let viewMonth = projEndYear > thisYear ? 12 : endMonth;
    if (projEndYear > thisYear) {
      // 프로젝트 상태와 비교하기 위한 for문
      for (let i = 0; i < dataset.length; i++) {
        // 프로젝트 상태와 같다면 if문으로 이동
        if (project.status === dataset[i].label) {
          // 1월부터 12월까지 for문을 돌린다.
          for (let j = startMonth - 1; j < labels.length; j++) {
            // 프로젝트 종료일까지 데이터 넣어주고, 나머진 0으로 처리
            if (j < viewMonth) {
              dataset[i].data[j] += 1;
            }
          }
        }
      }
    } else {
      // 올해 안에 끝나는 프로젝트라면 startMonth ~ endMonth까지만 그래프 출력
      for (let i = 0; i < dataset.length; i++) {
        if (project.status === dataset[i].label) {
          for (let j = startMonth - 1; j < endMonth; j++) {
            if (j < viewMonth) {
              dataset[i].data[j] += 1;
            }
          }
        }
      }
    }
  });
  // canvas 드로잉
  const custom_monthBarChart = new Chart(
    document.getElementById("custom_monthBarChart"),
    test_data_bar
  );
};

function stratPay(planNo, userId) {
$.ajax({
  type: "post",
  url: "/app/getPaymentsPlanVO.do",
  data: {"planNo" : planNo},
  dataType: "json",
  success: function (PaymentsPlanVO) {
    requestPay(PaymentsPlanVO, userId); // 결제 시스템 메서드로 해당 vo를 파라미터로 보낸다.
  },error: function (err) {
    console.log("stratPay() err status : " + err.status);
  }
});
}



// 결제 시스템 메서드
function requestPay(ppvo, userId) {
  var IMP = window.IMP; // 생략 가능
  IMP.init("imp50339794"); // 예: imp00000000
  IMP.request_pay({ // param
      pg: "html5_inicis",
      pay_method: "card",
      name: ppvo.title,
      amount: ppvo.price,
      buyer_email: userId,
  }, function (rsp) { // callback
      if (rsp.success) {
        paySuccess(rsp);
    } else {
      var msg = "결제에 실패하였습니다.";
      msg += "에러내용 : " + rsp.error_msg;
      console.log("msg => " + msg);
    }
  });
}

function paySuccess(params) {
  let toController = {
    "price" : params.paid_amount,
    "status" : params.status,
    "planName" : params.name,
    "paidDate" : new Date(params.paid_at),
    "payMethod" : params.pay_method,
  }
  $.ajax({
    type: "post",
    url: "/app/paySuccess.do",
    data: JSON.stringify(toController),
    contentType:'application/json;charset=utf-8',
    success: function (resp) {
      alert("결제가 완료되었습니다.");
      location.href="/app/index";
    },error: function (err) {
      alert("결제 실패했습니다. \n문제가 지속된다면 관리자에게 문의해주세요.");
      console.log("paySuccess() err status : " + err.status);
    }
  });
}

function writePaymentHistory() {
  if(window.location.pathname === "/user/my-page"){
    const tbody = document.querySelector(".payment-history-list-tbody");

    $.ajax({
      type: "post",
      url: "/getPaymentHistory.do",
      success: function (psvoList) {
        if(psvoList.length === 0){
          tbody.innerHTML = `<tr>
                              <td colspan="5">결제 내역이 존재하지 않습니다.</td>
                            </tr>`;
        } else {
          psvoList.forEach(e => {
            e.status = formatPayStatus(e.status);
            e.payMethod = formatPayMethod(e.payMethod);
            tbody.innerHTML += `<tr>
                                  <td scope="row">${e.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원</td>
                                  <td>${e.payMethod}</td>
                                  <td>${e.planName}</td>
                                  <td>${e.paidDate}</td>
                                  <td>${e.status}</td>
                                </tr>`;
          });
        }
        
      },
      error: function (err) {
        console.log("writePaymentHistory() err status : " + err.status);
      }
    });
  }
}

function formatPayStatus(param) {
  let str = "";
  if(param === "paid") {
    str = "결제완료";
  } else if(param === "ready") {
    str = "미결제";
  } else {
    str = "결제실패";
  }
  return str;
}

function formatPayMethod(param) {
  let str = "";

  if(param === "card" || param === "point") {
    str = "카드결제";
  } else if(param === "trans") {
    str = "실시간계좌이체";
  } else if(param === "vbank") {
    str = "가상계좌";
  } else if(param === "phone") {
    str = "휴대폰결제";
  } 
  return str;
}

// index페이지의 데이터 사용량 갱신하는 메서드
function getUserMaxUploadCapacity(){
  $.ajax({
    type: "post",
    url: "/getUserMaxUploadCapacity.do",
    success: function (res) {
      let dataUsage = Math.floor(res.userVO.userUploadUsage/res.userMaxUploadCapacity*100);
      let dataType = "";
      let UserDataType = "";
      let dataValue;

      if(res.userMaxUploadCapacity >= 1000){
        res.userMaxUploadCapacity /= 1000;
        dataType = "GB";
      } else {
        dataType = "MB";
      }
      if(res.userVO.userUploadUsage >= 1000){
        UserDataType = "GB";
        dataValue = res.userVO.userUploadUsage/1000;
      } else {
        UserDataType = "MB";
        dataValue = res.userVO.userUploadUsage;
      }
      $("#dataUsageChart").data('easyPieChart').update(dataUsage);

      document.getElementById("showUserDataUsage").innerHTML = `
      <button class="payBtn" onclick="location.href='/app/pricing'">
        <span class="payBtn__text">
          구독하기
        </span>
        <svg class="payBtn__svg" role="presentational" viewBox="0 0 600 600">
          <defs>
            <clipPath id="myClip">
              <rect x="0" y="0" width="100%" height="50%" />
            </clipPath>
          </defs>
          <g clip-path="url(#myClip)">
            <g id="money">
              <path d="M441.9,116.54h-162c-4.66,0-8.49,4.34-8.62,9.83l.85,278.17,178.37,2V126.37C450.38,120.89,446.56,116.52,441.9,116.54Z" fill="#699e64" stroke="#323c44" stroke-miterlimit="10" stroke-width="14" />
              <path d="M424.73,165.49c-10-2.53-17.38-12-17.68-24H316.44c-.09,11.58-7,21.53-16.62,23.94-3.24.92-5.54,4.29-5.62,8.21V376.54H430.1V173.71C430.15,169.83,427.93,166.43,424.73,165.49Z" fill="#699e64" stroke="#323c44" stroke-miterlimit="10" stroke-width="14" />
            </g>
            <g id="creditcard">
              <path d="M372.12,181.59H210.9c-4.64,0-8.45,4.34-8.58,9.83l.85,278.17,177.49,2V191.42C380.55,185.94,376.75,181.57,372.12,181.59Z" fill="#a76fe2" stroke="#323c44" stroke-miterlimit="10" stroke-width="14" />
              <path d="M347.55,261.85H332.22c-3.73,0-6.76-3.58-6.76-8v-35.2c0-4.42,3-8,6.76-8h15.33c3.73,0,6.76,3.58,6.76,8v35.2C354.31,258.27,351.28,261.85,347.55,261.85Z" fill="#ffdc67" />
              <path d="M249.73,183.76h28.85v274.8H249.73Z" fill="#323c44" />
            </g>
          </g>
          <g id="wallet">
            <path d="M478,288.23h-337A28.93,28.93,0,0,0,112,317.14V546.2a29,29,0,0,0,28.94,28.95H478a29,29,0,0,0,28.95-28.94h0v-229A29,29,0,0,0,478,288.23Z" fill="#a4bdc1" stroke="#323c44" stroke-miterlimit="10" stroke-width="14" />
            <path d="M512.83,382.71H416.71a28.93,28.93,0,0,0-28.95,28.94h0V467.8a29,29,0,0,0,28.95,28.95h96.12a19.31,19.31,0,0,0,19.3-19.3V402a19.3,19.3,0,0,0-19.3-19.3Z" fill="#a4bdc1" stroke="#323c44" stroke-miterlimit="10" stroke-width="14" />
            <path d="M451.46,435.79v7.88a14.48,14.48,0,1,1-29,0v-7.9a14.48,14.48,0,0,1,29,0Z" fill="#a4bdc1" stroke="#323c44" stroke-miterlimit="10" stroke-width="14" />
            <path d="M147.87,541.93V320.84c-.05-13.2,8.25-21.51,21.62-24.27a42.71,42.71,0,0,1,7.14-1.32l-29.36-.63a67.77,67.77,0,0,0-9.13.45c-13.37,2.75-20.32,12.57-20.27,25.77l.38,221.24c-1.57,15.44,8.15,27.08,25.34,26.1l33-.19c-15.9,0-28.78-10.58-28.76-25.93Z" fill="#7b8f91" />
            <path d="M148.16,343.22a6,6,0,0,0-6,6v92a6,6,0,0,0,12,0v-92A6,6,0,0,0,148.16,343.22Z" fill="#323c44" />
          </g>
      
        </svg>
      </button>
      <br/><br/> 해당 계정에서 사용할 수 있는 총 데이터 사용량을 표시합니다. <br/><br/>
      현재 <strong>${res.userVO.nickname}</strong>님은 ${res.userMaxUploadCapacity}${dataType }중, <br/><strong>${dataValue}${UserDataType }</strong>를 사용중입니다.
      `;

    },
    error: function (err) {
      console.log("updateDataUsage() err status : " + err.status);
    }
  });
}

function getRecentTaskList() {

  $.ajax({
    type: "post",
    url: "/getRecentTaskList.do",
    success: function (recentTaskList) {
      const tbody = document.querySelector(".recent_task_list_for_index_page");

      if(recentTaskList.length === 0){
        tbody.innerHTML = `<tr>
                          <td colspan="3">참여중인 업무가 존재하지 않습니다.</td>
                        </tr>`;
        // tbody.append(tr.children[0]);
      } else {
        let cnt = 0;
        recentTaskList.forEach(e => {
          if(cnt >= 3){ 
            return false;
          }
          
          if(e.projNo != null){
            tbody.innerHTML += `<tr>
                              <td scope="row" class="text-truncate" style="max-width: 150px;">${e.title}</td>
                              <td class="text-truncate" style="max-width: 60px;">${e.projNo}</td>
                              <td>${e.status}</td>
                            </tr>`;
            cnt++;
          }
        });
      }
    },
    error: function (err) {
      console.log("getRecentTaskList() err status : " + err.status);
    }
  });

}

// function goToUserProfilePage(userId) {
// 	$.ajax({
// 		type: "post",
// 		url: "/goToUserProfilePage.do",
// 		data: {"userId" : userId},
// 		dataType: "josn",
// 		success: function (res) {
      
// 		},
// 		error: function (err) {
// 			console.log("goToUserProfilePage() err status : " + err.status);
// 		}
// 	});
// }

//////////////////////////////////////////////////////////////////////////////////////////////////////


function printTagGrid() {
   let search = location.search
   let params = new URLSearchParams(search);
   let tagNo = params.get('tagNo');

  const dataSource = new kendo.data.DataSource({
              transport: {
                read : {
                  url: "/app/tag/read",
                  method: "get",
                  data: {"tagNo":tagNo},
                  success:function(result) {
                    console.log(result);
                    }
                }
              },
            
              schema: {
                  model: {
                      fields: [{
                          tagNo: { type: "string"},
                          tagName: { type: "string"},
                          projNo: { type: "string"},
                          projectTitle: { type: "string"},
                          startDate: { type: "string" },
                          endDate: { type: "string" },
                          status: { type: "string" },
                          leader: { type: "string" },
                      }]
                  }
              },
              pageSize: 10
          });
          dataSource.fetch(function(){
            var data = this.data();
            let tagName = document.querySelector('.printTagName');
            tagName.innerHTML = data[0].tagName;
          });
        
      $("#tagGrid-table").kendoGrid({
          dataSource: dataSource,
          editable: false,
          pageable: true,
          sortable: true,
          navigatable: true,
          resizable: true,
          reorderable: true,
          groupable: true,
          messages: {
            commands: {
              search: "검색"
            }
          },
          dataBound: onDataBound,
          toolbar: ["search"],
          columns: [
          {
              field: "projectTitle",
              title: "프로젝트 명",
              template: "<a href='/app/project/main?projNo=#:projNo#&from=search'>#: projectTitle #</a>",
              width: 300
          }, {
              field: "startDate",
              title: "시작일",
              template: "<div> #: startDate#</div>",
              width: 130,
          }, {
              field: "endDate",
              title: "종료일",
              groupHeaderTemplate: "<div>#: endDate #</div>",
              width: 125
          }, {
              field: "status",
              title: "진행상태",
              template: "<div>#: status #</div>",
              width: 140
          }, {
              field: "leader",
              title: "책임자",
              template: "<div>#: leader #</div>",
              width: 120
          }
          ],
      });
      function onDataBound(e) {
        var grid = this;

        grid.table.find("tr").each(function () {
            var dataItem = grid.dataItem(this);

            kendo.bind($(this), dataItem);
        });
        $("#tagGrid-table .k-grid-footer").css('display', 'none');
    }

}

