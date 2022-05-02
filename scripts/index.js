//Helper: html string to node
function createHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  return div.firstChild;
}

//Helper: for setting the cursor to the end of the editable content
function setEndOfContenteditable(contentEditableElement) {
  var range, selection;
  range = document.createRange(); //Create a range (a range is a like the selection but invisible)
  range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
  range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
  selection = window.getSelection(); //get the selection object (allows you to change selection)
  selection.removeAllRanges(); //remove any selections already made
  try {
    selection.addRange(range); //make the range you have just created the visible selection
  } catch (error) {
    console.error(error);
  }
}

//Helper: insert an element after another
function insertAfter(el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

//Time: formats the minute
function checkMin(i) {
  return i < 10 ? '0' + i : i;
}

//Time: formats the hour for standard (12hr) time
function checkHour(i) {
  i = i % 12;
  return i == 0 ? 12 : i;
}

//Time: starts the time
function startTime() {

  //clear the timer
  if (window.newTab.clock.nextMinute)
    clearTimeout(window.newTab.clock.nextMinute);

  let today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  let pa = "";

  //sets PM and AM if not in military
  if (!window.newTab.clock.military) {
    if (h > 11)
      pa = " PM"
    else
      pa = " AM"
  }
  if (!window.newTab.clock.military)
    h = checkHour(h);

  // display the time
  document.getElementById('time').innerHTML = h + ":" + checkMin(m);
  document.getElementById("pa").innerHTML = pa;

  today = new Date();
  let s = today.getSeconds();
  let ms = today.getMilliseconds();
  let nextM = (60 - s) * 1000 + (1000 - ms);

  //calls changeMinute setting the timeout for when next minute occurs
  window.newTab.clock.nextMinute = setTimeout(function() {
    changeMinutes(h, m + 1);
  }, nextM);
}

//Time: updates minutes
function changeMinutes(h, m) {
  if (m % 10 == 0) {
    //sync time (pretty much every 10 minutes)
    startTime();
  } else {
    //change minutes display
    document.getElementById('time').innerHTML = h + ":" + checkMin(m);

    //calls self every minute to update the time
    window.newTab.clock.nextMinute = setTimeout(function() {
      changeMinutes(h, m + 1);
    }, 60000);
  }
}

//Widgets: sets the element to be draggable (customized for time, search bar, todo list)
function dragElement(elmnt) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  //depends on which element it is, different place to click
  if (elmnt.id == "timeWrapper")
    document.getElementById("time").onmousedown = dragMouseDown;
  if (elmnt.id == "searchWrapper")
    document.getElementById("searchDiv").onmousedown = dragMouseDown;
  if (elmnt.id == "todoWrapper")
    document.getElementById("todoDiv").onmousedown = dragMouseDown;
  if (elmnt.id == "infoWrapper")
    document.getElementById("info").onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  //when element is dragged
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    //sets window.dragged to be true to see if an element was moved
    if (!window.newTab.dragged)
      window.newTab.dragged = true;

  }

  // stop moving when mouse button is released
  function closeDragElement() {
    //reset the dragged to be false
    if (window.newTab.dragged) {
      window.newTab.dragged = false;

      //saves the current location for the elements
      if (elmnt.id == "timeWrapper") {
        chrome.storage.local.set({
          time_top_data: elmnt.style.top,
          time_left_data: elmnt.style.left
        }, function() {});
        window.newTab.clock.military = !window.newTab.clock.military;
      }
      if (elmnt.id == "searchWrapper") {
        chrome.storage.local.set({
          search_top_data: elmnt.style.top,
          search_left_data: elmnt.style.left
        }, function() {});
      }
      if (elmnt.id == "todoWrapper") {
        chrome.storage.local.set({
          todo_top_data: elmnt.style.top,
          todo_left_data: elmnt.style.left
        }, function() {});
      }
      if (elmnt.id == "infoWrapper") {
        window.newTab.infoMode -= 1;
        chrome.storage.local.set({
          info_top_data: elmnt.style.top,
          info_left_data: elmnt.style.left
        }, function() {});
      }
    }
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

//Time: toggles military time (24hr)
function updateMilitary() {
  window.newTab.clock.military = !window.newTab.clock.military;
  if (window.newTab.clock.military)
    chrome.storage.local.set({
      military_switch: 'on'
    }, function() {});
  else
    chrome.storage.local.set({
      military_switch: 'off'
    }, function() {});
  startTime();
}

//Search: toggles the visibility of the search bar
function updateSearch() {

  let searchWrapper = document.getElementById("searchWrapper");
  let searchSwitch = document.getElementById("searchSwitch");

  searchWrapper.classList.remove("firstStart");
  if (searchSwitch.checked) {
    searchSwitch.checked = false;
    searchWrapper.classList.add("exit");
    searchWrapper.classList.remove("entrance");
    chrome.storage.local.set({
      search_switch: "off"
    }, function() {});
  } else {
    searchSwitch.checked = true;
    searchWrapper.classList.add("entrance");
    searchWrapper.classList.remove("exit");
    chrome.storage.local.set({
      search_switch: "on"
    }, function() {});
  }
}

//Search bar: chaanges the search engine
function changeSearch() {
  chrome.storage.local.get({
    search_engine: 0
  }, function(data) {
    let index = data.search_engine + 1;
    if (index == window.newTab.searchEngines.length)
      index = 0;
    let searchInput = $('#searchInput');
    searchInput.parent().attr('action', window.newTab.searchEngines[index].action);
    console.log(window.newTab.searchEngines[index].action);
    let val = (searchInput.val() == searchInput.attr('data-placeholder') ? "" : searchInput.val());
    searchInput.attr('data-placeholder', window.newTab.searchEngines[index].placeholder);
    searchInput.val(val);
    searchInput.focus();
    searchInput.blur();
    chrome.storage.local.set({
      search_engine: index
    }, function() {});
  });
}

//Time: toggles the visibility of the time display
function updateTime() {

  let timeWrapper = document.getElementById("timeWrapper");
  let timeSwitch = document.getElementById("timeSwitch");

  timeWrapper.classList.remove("firstStart");
  if (timeSwitch.checked) {
    timeSwitch.checked = false;
    timeWrapper.classList.add("exit");
    timeWrapper.classList.remove("entrance");
    chrome.storage.local.set({
      time_switch: "off"
    }, function() {});
  } else {
    timeSwitch.checked = true;
    timeWrapper.classList.add("entrance");
    timeWrapper.classList.remove("exit");
    chrome.storage.local.set({
      time_switch: "on"
    }, function() {});
  }
}

//Time: toggles the visibility of the info display
// function updateinfo() {
//
//   let infoWrapper = document.getElementById("infoWrapper");
//   let infoSwitch = document.getElementById("infoSwitch");
//
//   infoWrapper.classList.remove("firstStart");
//   if (infoSwitch.checked) {
//     infoSwitch.checked = false;
//     infoWrapper.classList.add("exit");
//     infoWrapper.classList.remove("entrance");
//     chrome.storage.local.set({
//       info_switch: "off"
//     }, function() {});
//   } else {
//     infoSwitch.checked = true;
//     infoWrapper.classList.add("entrance");
//     infoWrapper.classList.remove("exit");
//     chrome.storage.local.set({
//       info_switch: "on"
//     }, function() {});
//   }
// }

//Time: toggles the favorites source of backgrounds
// function updateFav() {
//
//   let favSwitch = document.getElementById("favSwitch");
//   if (favSwitch.checked) {
//     favSwitch.checked = false;
//     chrome.storage.local.set({
//       fav_switch: "off"
//     }, function() {});
//   } else {
//     chrome.storage.local.get({
//       fav_list: []
//     }, function(data) {
//       //don't let user turn on fav images if they have no fav backgronds
//       if (data.fav_list.length == 0) {
//         document.getElementById("menu").classList.add("delay");
//         $.alert({
//           title: 'No Favorites',
//           content: 'You don\'t have any favorite backgrounds. To add backgrounds to favorites, scroll down the menu and click the heart when you see a background you like.',
//           type: 'red',
//           boxWidth: '25%',
//           backgroundDismiss: true,
//           useBootstrap: false,
//           typeAnimated: true,
//           theme: 'dark',
//           animation: window.newTab.confirmSettings.animation,
//           closeAnimation: window.newTab.confirmSettings.animation,
//           animateFromElement: false,
//           scrollToPreviousElement: false,
//           buttons: {
//             Okay: {
//               text: "Okay",
//               action: function() {
//                 setTimeout(function() {
//                   document.getElementById("menu").classList.remove("delay")
//                 }, 250);
//               }
//             }
//           }
//         });
//       } else {
//         favSwitch.checked = true;
//         chrome.storage.local.set({
//           fav_switch: "on"
//         }, function() {});
//       }
//     });
//   }
// }

//Todo: toggles the visibility of the todo list
function updateTodo() {

  let todoWrapper = document.getElementById("todoWrapper");
  let todoSwitch = document.getElementById("todoSwitch");

  todoWrapper.classList.remove("firstStart");
  if (todoSwitch.checked) {
    todoSwitch.checked = false;
    todoWrapper.classList.add("exit");
    todoWrapper.classList.remove("entrance");
    chrome.storage.local.set({
      todo_switch: "off"
    }, function() {});
  } else {
    todoSwitch.checked = true;
    todoWrapper.classList.add("entrance");
    todoWrapper.classList.remove("exit");
    chrome.storage.local.set({
      todo_switch: "on"
    }, function() {});
  }
}

//Filters: Updates the filter Effects
function updateFilter() {
  // console.log(document.getElementById("darkSlider").value);
  let darkVal = document.getElementById("darkSlider").value;
  let satuVal = document.getElementById("satuSlider").value;
  let conVal = document.getElementById("conSlider").value;
  let blurVal = document.getElementById("blurSlider").value;
  document.getElementById("backloader").style = "filter: brightness(" + darkVal / 100 + ") " +
    "saturate(" + satuVal / 100 + ") " +
    "contrast(" + conVal / 100 + ") " +
    "blur(" + blurVal / 10 + "px);";
  let arr = [darkVal, satuVal, conVal, blurVal];
  chrome.storage.local.set({
    filter: arr
  }, function() {});
}

//Todo: saves the Todo list to the chrome storage
function saveTodo() {
  let lilist = document.getElementById("myUL").getElementsByTagName("LI");
  let store = "";
  for (i = 0; i < lilist.length; i++) {
    if (lilist[i].classList.contains('checked'))
      store += "☑" + lilist[i].innerText.trim();
    else
      store += lilist[i].innerText.trim();
  }
  chrome.storage.local.set({
    todo_data: store
  }, function() {});
}

//Function for the data reset
function resetData() {
  $.confirm({
    title: 'Are you sure you want to reset your data?',
    content: '<span style="font-size: 16px;">Choose what data you would like to reset: </span><br>' +
      '<br><label class="reset-container""> Widgets Location' +
      '<input type="checkbox" id="reset-input-loc" checked="checked">' +
      '<span class="reset-checkmark"></span></label>' +
      '<br><label class="reset-container"> Widgets Preferences/Data' +
      '<input type="checkbox" id="reset-input-pref" checked="checked">' +
      '<span class="reset-checkmark"></span></label>' +
      '<br><label class="reset-container"> Favorite Backgrounds' +
      '<input type="checkbox" id="reset-input-fav" checked="checked">' +
      '<span class="reset-checkmark"></span></label>' +
      '<br><label class="reset-container"> Removed Backgrounds' +
      '<input type="checkbox" id="reset-input-rem" checked="checked">' +
      '<span class="reset-checkmark"></span></label>' +
      '<br>This action cannot be undone!',
    boxWidth: '25%',
    useBootstrap: false,
    type: 'blue',
    escapeKey: 'cancel',
    theme: 'dark',
    animation: window.newTab.confirmSettings.animation,
    closeAnimation: window.newTab.confirmSettings.animation,
    animateFromElement: false,
    scrollToPreviousElement: false,
    buttons: {
      ok: {
        text: "I understand, reset",
        btnClass: 'btn-blue',
        keys: ['enter'],
        action: function() {
          if (this.$content.find('#reset-input-loc').is(":checked")) {
            chrome.storage.local.set({
                time_top_data: '',
                time_left_data: '',
                info_top_data: '',
                info_left_data: '',
                todo_top_data: '',
                todo_left_data: '',
                search_top_data: '',
                search_left_data: '',
              },
              function() {});
          }
          if (this.$content.find('#reset-input-pref').is(":checked")) {
            chrome.storage.local.set({
                military_switch: 'off',
                time_switch: 'on',
                info_mode: 0,
                info_switch: 'on',
                search_switch: 'on',
                todo_switch: 'on',
                todo_data: ''
              },
              function() {});
          }
          if (this.$content.find('#reset-input-fav').is(":checked")) {
            chrome.storage.local.set({
                fav_switch: 'off',
                fav_list: []
              },
              function() {});
          }
          if (this.$content.find('#reset-input-rem').is(":checked")) {
            chrome.storage.local.set({
                black_list: []
              },
              function() {});
          }
          location.reload();
        }
      },
      cancel: function() {
        setTimeout(function() {
          document.getElementById("menu").classList.remove("delay")
        }, 250);
      }
    }
  });
}

//Todo: Set the list li element listeners
function setLiListeners(li) {
  li.onclick = function() {
    if (document.activeElement == null || !document.activeElement.classList.contains('listText')) {
      $(this).find('.listText').focus();
      setEndOfContenteditable(this.firstChild);
    } else {
      $(this).find('.listText').focus();
    }
    // let li = document.getElementById("myUL").getElementsByTagName("li");
    // for (i = 0; i < li.length; i++) {
    //   if (li[i].innerText == "\u00D7") {
    //     let node = createHTML("<br>");
    //     li[i].insertBefore(node, li[i].firstChild);
    //   }
    // }
    $(this).parent().sortable("disable");
  }
  li.onmousedown = function(evt) {
    if (evt.button === 2) {
      evt.preventDefault();
      window.getSelection().empty();
    }
  }
  li.addEventListener('contextmenu', function(evt) {
    evt.preventDefault();
    this.classList.toggle('checked');
    window.getSelection().empty();
    saveTodo();
  });
  li.addEventListener('keyup', (evt) => {
    if (evt.keyCode === 8) {
      if (li.innerText == "\u00D7") {
        evt.preventDefault();
        let node = createHTML("<br>");
        li.firstChild.appendChild(node);
      }
    }
  });
  li.addEventListener('keydown', (evt) => {
    if (evt.which === 13) {
      let li = document.activeElement.parentElement;
      let newLi = newListItem("", false);
      insertAfter(newLi, li);
      document.getElementById("todoInput").style = "display: none;";
      saveTodo();
      li.nextElementSibling.firstChild.focus();
      evt.preventDefault();
    } else if (evt.keyCode === 8) {
      let li = document.activeElement.parentElement;
      if (li.innerText.trim() == "\u00D7") {
        evt.preventDefault();
        let previous = li.previousElementSibling.firstChild;
        if (previous != null) {
          previous.focus();
          setEndOfContenteditable(previous);
        }
        li.parentNode.removeChild(li);
        if (document.getElementById("myUL").getElementsByTagName("li").length == 0)
          document.getElementById("todoInput").style = "";
        saveTodo();
      }
    } else if (evt.keyCode === 38) {
      let previous = li.previousElementSibling.firstChild;
      if (previous != null) {
        previous.focus();
      }
    } else if (evt.keyCode === 40) {
      let next = li.nextElementSibling.firstChild;
      if (next != null) {
        next.focus();
      }
    }
  });
  li.firstChild.addEventListener("blur", function() {
    $(this).parent().parent().sortable("enable");
  }, false);
  li.firstChild.addEventListener("input", function() {
    saveTodo();
  });
}

//Todo: new list item, returns the list item created
function newListItem(text, check) {
  let li = document.createElement("li");
  if (check) {
    li.classList.toggle('checked');
  }
  let t;
  if (text != "") {
    t = document.createTextNode(text);
  } else {
    t = document.createElement("br");
  }
  let txtSpan = document.createElement("span");
  txtSpan.appendChild(t);
  li.appendChild(txtSpan);
  txtSpan.setAttribute("contenteditable", "true");
  txtSpan.setAttribute("spellcheck", "false")
  txtSpan.classList.add('listText');
  document.getElementById("myUL").appendChild(li);
  setLiListeners(li);
  //the spaan is the close button
  let span = document.createElement("SPAN");
  let txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  li.appendChild(span);
  //setting the close click event listener
  span.addEventListener('click', function() {
    let li = this.parentElement;
    if (li.parentElement != null) //click sometimes triggers twice, first one deletes, second one needs to fizzle
      li.parentElement.removeChild(li);
    if (document.getElementById("myUL").getElementsByTagName("li").length == 0)
      document.getElementById("todoInput").style = "";
    saveTodo();
  });
  return li;
}

// adds a background to favorites
function addFav(bg) {
  chrome.storage.local.get({
    fav_list: []
  }, function(data) {
    let list = data.fav_list;
    list.push(bg);
    chrome.storage.local.set({
      fav_list: list
    }, function() {})
  });
}

// remove a background from favorites
function removeFav(bg) {
  chrome.storage.local.get({
    fav_list: []
  }, function(data) {
    let list = data.fav_list;
    for (var i = 0; i < list.length; i++) {
      if (list[i].link == bg.link) {
        list.splice(i, 1);
        i--;
      }
    }
    chrome.storage.local.set({
      fav_list: list
    }, function() {})
  });
}

// add a backgorund to the blacklist
function addBlack(bg) {
  chrome.storage.local.get({
    black_list: []
  }, function(data) {
    let list = data.black_list;
    list.push(bg.link);
    chrome.storage.local.set({
      black_list: list
    }, function() {})
  });
}


// shows the report background dialog
function reportBk() {
  document.getElementById("menu").classList.add("delay");
  $.confirm({
    title: false,
    content: window.newTab.report_embed.replace("\\back", encodeURI(JSON.stringify(window.newTab.back))),
    boxWidth: '640px',
    useBootstrap: false,
    escapeKey: 'Close',
    animation: window.newTab.confirmSettings.animation,
    closeAnimation: window.newTab.confirmSettings.animation,
    animateFromElement: false,
    scrollToPreviousElement: false,
    buttons: {
      Close: function() {
        setTimeout(function() {
          document.getElementById("menu").classList.remove("delay")
        }, 250);
      }
    }
  });
}

// loads the background information
function loadInfo() {
  if (window.newTab.infoDisplay != null) {
    let infoChosen = window.newTab.infoDisplay[window.newTab.infoMode];
    let infoText = "";
    for (i = 0; i < infoChosen.length; i++) {

      //set the font size
      let size = "font-size: ";
      if (infoChosen[i].size == null) {
        size = "";
      } else if (infoChosen[i].size == "small") {
        size += "calc(6px + .6vw)";
      } else if (infoChosen[i].size == "large") {
        size += "calc(16px + .6vw)";
      } else {
        size += "calc(10px + .6vw)";
      }

      infoText += '<span style="' + size + '; white-space: nowrap;"' + '>' + window.newTab.back[infoChosen[i].name] + '</span><br>';
    }
    document.getElementById('info').innerHTML = infoText;
    let infoX = document.getElementById("infoWrapper").offsetLeft;
    let ww = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    if (infoX > 3 * ww / 4) {
      $('#info').css('text-align', 'right');
      $('#info').css('transform', 'translate(-100%, 0%)');
    } else if (infoX > ww / 4) {
      $('#info').css('text-align', 'center');
      $('#info').css('transform', 'translate(-50%, 0%)');
    } else {
      $('#info').css('text-align', 'left');
      $('#info').css('transform', 'translate(0%, 0%)');
    }
  } else {
    $('#infoMenuItem').css("display", "none");
    $('#infoWrapper').css("display", "none");
  }
}

//change the background info panel up/down
function updateInfoMode() {
  window.newTab.infoMode += 1;
  if (window.newTab.infoMode == window.newTab.infoDisplay.length) {
    window.newTab.infoMode = 0;
  }
  chrome.storage.local.set({
    info_mode: window.newTab.infoMode
  }, function() {
    loadInfo();
  });
}

//change the ui animation behavior
function updateUiAni() {
  document.getElementById("timeWrapper").classList.toggle('noanimate');
  document.getElementById("todoWrapper").classList.toggle('noanimate');
  document.getElementById("searchWrapper").classList.toggle('noanimate');
  document.getElementById("infoWrapper").classList.toggle('noanimate');
  document.getElementById("menu").classList.toggle('noanimate');
  document.getElementById("rightMenus").classList.toggle('noanimate');
  window.newTab.uianimation = !window.newTab.uianimation;

  if (window.newTab.uianimation) {
    document.getElementById("uianiswitch").checked = true;
    window.newTab.confirmSettings.animation = 'opacity';
    chrome.storage.local.set({
      animation: true
    }, function() {});
  } else {
    document.getElementById("uianiswitch").checked = false;
    window.newTab.confirmSettings.animation = 'none';
    chrome.storage.local.set({
      animation: false
    }, function() {});
  }
}

//change the auto pause behavior
function updateAutoPause() {

  window.newTab.autopause = !window.newTab.autopause;

  if (window.newTab.autopause) {
    document.getElementById("autopauseswitch").checked = true;
    chrome.storage.local.set({
      autopause: true
    }, function() {});
  } else {
    document.getElementById("autopauseswitch").checked = false;
    chrome.storage.local.set({
      autopause: false
    }, function() {});
  }
}

//change the background repeat
function updateRepeat() {

  window.newTab.avoidRepeat = !window.newTab.avoidRepeat;

  if (window.newTab.avoidRepeat) {
    document.getElementById("repeatswitch").checked = true;
    chrome.storage.local.set({
      repeat: true
    }, function() {});
  } else {
    document.getElementById("repeatswitch").checked = false;
    chrome.storage.local.set({
      repeat: false
    }, function() {});
  }
}

//function for autoPause, set to check on tab activated
function autoPause() {

  //check if auto pause is on and if
  if (!window.newTab.autopause || !window.newTab.back.fileType == "video")
    return;

  //on got tab info function
  function onGot(tabInfo) {
    var vid = document.getElementById("backdropvid");
    if (tabInfo.active && vid.readyState === 4) {
      vid.play();
    } else {
      vid.pause();
    }
  }

  //error function
  function onError(error) {
    console.log(`Error: ${error}`);
  }

  const gettingCurrent = chrome.tabs.getCurrent();
  gettingCurrent.then(onGot, onError);
}


//loads a random background
function loadBackground(backJson) {
  console.log("Loaded background.json:");
  console.log(backJson.sources);
  window.newTab.backlist = [];

  //loads the background info panel data
  window.newTab.infoDisplay = backJson.info;
  if (backJson.info_title) {
    infoTitle = backJson.info_title;
    $('#infoMenuText').text(infoTitle);
    $('#infoMenuItem').attr('data', "Toggles the " + infoTitle);
  }

  //loads the support link
  if (backJson.support_link) {
    window.newTab.support_link = backJson.support_link;
  } else {
    window.newTab.support_link = "https://emilyxietty.github.io/";
  }

  //loads the support link
  if (backJson.report_embed) {
    window.newTab.report_embed = backJson.report_embed;
  } else {
    window.newTab.report_embed = "";
  }

  let vid = document.getElementById("backdropvid");
  let img = document.getElementById("backdropimg");
  if (backJson.type == "video") {
    vid.style = "";
    img.style = "display: none;"
  } else if (backJson.type == "image") {
    img.style = "";
    vid.style = "display: none;"
  }

  backList = backJson.sources;
  let index = 0;
  bkMenu = document.getElementById("backgroundMenu");

  //function to set background
  function setBackground() {
    let vid = document.getElementById("backdropvid");
    let img = document.getElementById("backdropimg");
    let str = window.newTab.back.link;

    //console logging
    // console.log("Favorites:");
    // console.log(data.fav_list);
    // console.log("Defaulted backgorund:");
    // console.log(str);

    let fext = str.substring(str.length - 3).toLowerCase();
    if (fext == 'jpg' || fext == 'png' || fext == 'gif') { //the file type is image
      window.newTab.back.fileType = "image";
      img.src = str;
      img.style = "";
      img.onload = function() {
        img.style.opacity = 100;
        $('#progress-line').css("opacity", "0");
        //to counteract a bug that makes the background start from Bottom
        window.scrollTo(0, 0);
      }
      vid.style = "display: none;"
    } else { //file type is video
      window.newTab.back.fileType = "video";
      img.style = "display: none;"
      vid.style = "";
      vid.oncanplay = function() {
        vid.style.opacity = 100;
        $('#progress-line').css("opacity", "0");
        //to counteract a bug that makes the background start from Bottom
        window.scrollTo(0, 0);

      };
      //fetch the full video to try to force caching (reduce bandwidth)
      const videoRequest = fetch(str)
        .then(response => response.blob());
      videoRequest.then(blob => {
        vid.src = window.URL.createObjectURL(blob);
      });
      vid.load();
    }
    loadInfo();
  }

  //functional prograamming (recursive but there shouldn't be many calls)
  function loadSource(backList) {

    //end case
    if (index == backList.length) {

      chrome.storage.local.get({
          lastShown: '',
          fav_list: [],
          fav_switch: 'off',
          black_list: [],
          repeat: false
        },
        function(data) {

          //set repeat global variable
          window.newTab.avoidRepeat = data.repeat;

          //if none of the sources are selected, use the defualt provided and give warning alert
          if (window.newTab.backlist.length == 0 && (data.fav_switch == 'off' || (data.fav_switch == 'on' && data.fav_list.length == 0))) {
            if (backJson.default != null) {
              window.newTab.back = backJson.default;
              setBackground();
            }
            $.alert({
              title: 'No Background sources selected',
              content: 'A default background was loaded. Please select a source in the left hand menu, and then refresh the page.',
              type: 'blue',
              boxWidth: '25%',
              backgroundDismiss: true,
              useBootstrap: false,
              typeAnimated: true,
              theme: 'dark',
              animation: window.newTab.confirmSettings.animation,
              closeAnimation: window.newTab.confirmSettings.animation,
              animateFromElement: false,
              scrollToPreviousElement: false,
              buttons: {
                Okay: {
                  text: "Okay",
                  action: function() {
                    chrome.storage.local.set({
                      fav_switch: "off"
                    }, function() {});
                  }
                }
              }
            });
          } else { //loading ended: choose a random background

            //adds the favorite list to the list of possible
            if (data.fav_switch == 'on') {
              window.newTab.backlist.push(...data.fav_list);
            }

            //if not the specific case that user only wants one faved background
            if (!(data.fav_list.length == 1 && window.newTab.backlist.length == 1)) {

              //then remove the blacklisted backgrounds from the list
              for (var i = 0; i < window.newTab.backlist.length; i++) {
                for (var j = 0; j < data.black_list.length; j++) {
                  if (window.newTab.backlist[i] !== null && window.newTab.backlist[i].link == data.black_list[j]) {
                    window.newTab.backlist.splice(i, 1);
                    i--;
                  }
                }
              }
            }

            // problematic user removed all source-selected backgrounds
            if (window.newTab.backlist.length == 0) {
              if (backJson.default != null) {
                window.newTab.back = backJson.default;
                setBackground();
              }
              $.alert({
                title: 'Too many backgrounds removed',
                content: 'A default background was loaded. You have removed all backgrounds in the sources you selected, you can reset your removed backgrounds or select more background sources.',
                type: 'red',
                boxWidth: '25%',
                backgroundDismiss: true,
                useBootstrap: false,
                typeAnimated: true,
                theme: 'dark',
                animation: window.newTab.confirmSettings.animation,
                closeAnimation: window.newTab.confirmSettings.animation,
                animateFromElement: false,
                scrollToPreviousElement: false,
                buttons: {
                  ok: {
                    text: "Reset my removed backgrounds",
                    btnClass: 'btn-red',
                    keys: ['enter'],
                    action: function() {
                      chrome.storage.local.set({
                        black_list: []
                      }, function() {
                        location.reload();
                      });
                    }
                  },
                  cancel: function() {}
                }
              });
              loadInfo();
            } else {

              // remove the last shown if there is more than one
              if (window.newTab.avoidRepeat && window.newTab.backlist.length != 1) {
                for (var i = 0; i < window.newTab.backlist.length; i++) {
                  if (window.newTab.backlist[i] != null && window.newTab.backlist[i].link == data.lastShown) {
                    window.newTab.backlist.splice(i, 1);
                    i--;
                  }
                }
              }

              //get the random image number
              let imn = Math.floor(Math.random() * window.newTab.backlist.length);
              window.newTab.back = window.newTab.backlist[imn];
              setBackground();

              //save the last shown in chrome
              chrome.storage.local.set({
                lastShown: window.newTab.backlist[imn].link
              }, function() {});

              //setting the fav switch and like buttons
              // if (data.fav_switch == 'on' && data.fav_list.length > 0) {
              //   document.getElementById("favSwitch").checked = true;
              // }

              //if the current image is in favorites, make the heart button filled
              for (var i = 0; i < data.fav_list.length; i++) {
                if (data.fav_list[i].link == window.newTab.back.link) {
                  $('.like-button').toggleClass('is-active');
                  break;
                }
              }
            }
          }
        });
      return;
    } else {
      let name = backList[index].name;

      //build the json object to store data
      obj = {};
      key = name.split(' ').join('-');
      obj[key] = 'on';

      //descriptors shouldn't be more than 34 characters
//      let descriptor = "Backgrounds from " + name;
//      if (backList[index].description != null) {
//        descriptor = backList[index].description;
//      }

      //create the backgroundMenu switch and add it to background menu
      var itemNode = createHTML("<div class=\"menuItem\" data=\"" + "\"></div>");
      var textNode = createHTML("<div class=\"menuText\">" + name + "</div>");
      var divNode = createHTML("<div class=\"sliderWrapper\"> <label class=\"switch\"> <input type=\"checkbox\" ID=\"" + key + "\" checked> <span class=\"slider round\"></span> </label> </div>");
      itemNode.appendChild(textNode);
      itemNode.appendChild(divNode);
      bkMenu.insertBefore(itemNode, document.getElementById("favoriteSlider"));

      //adding the onClick for the swtiches
      document.getElementById(key).parentElement.onclick = function() {
        checkElement = this.firstElementChild;
        obj = {};
        key = checkElement.id;
        if (checkElement.checked) {
          checkElement.checked = false;
          obj[key] = "off";
          chrome.storage.local.set(obj, function() {});
        } else {
          checkElement.checked = true;
          obj[key] = "on";
          chrome.storage.local.set(obj, function() {});
        }
      }

      //add source to each element of the list
      let toPushList = backList[index].list
      for (var i = 0; i < toPushList.length; i++) {
        toPushList[i]["source"] = name;
      }

      //storing and getting data from chrome to see whether it was on or off
      chrome.storage.local.get(obj, function(data) {
        if (data[key] == 'off') {
          document.getElementById(key).checked = false;
        } else {
          window.newTab.backlist.push(...toPushList);
        }
        index += 1;
        loadSource(backList);
      });
    }
  }

  loadSource(backList);
}

//function to loadLanguage into UI and strings
function loadLanguage(langJson) {
  window.newTab.langStrings = langJson;
}

//function to set language
function setLanguage(lang) {
  return new Promise(function(resolve, reject) {
    const langUrl = chrome.runtime.getURL('locales/' + lang + '.json');
    fetch(langUrl)
      .then((response) => response.json())
      .then((json) => {
        loadLanguage(json);
        resolve(lang);
      });
  });
}

//function to get and determine the language
function getLanguage(configJson) {
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get({
      lang: ""
    }, function(data) {
      let lang = navigator.language;

      //default language (find user locale)
      if (data.lang === "") {
        window.newTab.config = configJson;

        //nav.language not found
        if (configJson.locales.indexOf(lang) == -1) {
          //drop area code
          lang = lang.substring(0, lang.indexOf('-'))
        }

        //language still not found, default to default locale
        if (configJson.locales.indexOf(lang) == -1) {
          lang = configJson.default_locale;
        }
      } else {
        lang = data.lang;
      }
      setLanguage(lang)
        .then((lang) => resolve(lang));
    });
  });
}

$(document).ready(function() {

  //define custom global objects
  window.newTab = {};
  window.newTab.clock = {};
  window.newTab.confirmSettings = {};
  window.newTab.confirmSettings.animation = 'opacity';

  //Print console warning
  console.log("%c--- Danger Zone ---", "color: red; font-size: 25px");
  console.log("%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or \"hack\", it is likely a scam.", "font-size: 16px;");
  console.log("%cIf you ARE a developer, feel free to check this project out here:", "font-size: 16px;");
  console.log("%chttps://github.com/emilyxietty/", "font-size: 16px;");

  // $('#progress-line').css("display", "flex");
  const configUrl = chrome.runtime.getURL('resources/config.json');
  fetch(configUrl)
    .then((response) => response.json())
    .then((json) => getLanguage(json))
    .then((lang) => {

      //if Chrome is online
      if (window.navigator.onLine) {
        //loads the backgorund json
        const jsonUrl = chrome.runtime.getURL('resources/background_' + lang + '.json');
        fetch(jsonUrl)
          .then((response) => response.json())
          .then((json) => loadBackground(json));

      } else {
        //send an error alert for no internet connection
        $.alert({
          title: 'Error',
          content: 'No internet access. Please check your connection and try again.',
          type: 'red',
          boxWidth: '25%',
          backgroundDismiss: true,
          useBootstrap: false,
          typeAnimated: true,
          theme: 'dark',
          animation: window.newTab.confirmSettings.animation,
          closeAnimation: window.newTab.confirmSettings.animation,
          animateFromElement: false,
          scrollToPreviousElement: false,
          buttons: {
            close: {
              text: "Close",
              action: function() {
                $('#progress-line').css("opacity", "0");
              }
            }
          }
        });
      }
    })


  //get advanced settings
  chrome.storage.local.get({
    animation: true,
    autopause: true
  }, function(data) {
    if (data.animation) {
      window.newTab.confirmSettings.animation = 'opacity';
      window.newTab.uianimation = true;
    } else {
      window.newTab.confirmSettings.animation = 'none';
      window.newTab.uianimation = false;
      document.getElementById("menu").classList.add('noanimate');
      document.getElementById("rightMenus").classList.add('noanimate');
      document.getElementById("timeWrapper").classList.add('noanimate');
      document.getElementById("todoWrapper").classList.add('noanimate');
      document.getElementById("searchWrapper").classList.add('noanimate');
      document.getElementById("infoWrapper").classList.add('noanimate');
    }
    window.newTab.autopause = data.autopause;
  });

  //set the search engine list
  window.newTab.searchEngines = [{
      "action": "https://www.google.com/search",
      "placeholder": "Google Search"
    },
    {
      "action": "https://www.bing.com/search",
      "placeholder": "Bing Search"
    },
    {
      "action": "https://search.yahoo.com/search",
      "placeholder": "Yahoo Search"
    },
    {
      "action": "https://duckduckgo.com/",
      "placeholder": "Duckduckgo"
    }
  ];

  //add the rightMenus
  chrome.bookmarks.getTree(function(bkList) {
    window.newTab.bookmarklist = bkList[0].children[1].children;

    if (window.newTab.bookmarklist.length == 0) {
      // document.getElementById("bookmarks").style = "display: none;"
    } else {
      let bkHtml = "";

      //builds the bookmark html
      // function recurBkList(bklist) {
      //   let node = bklist[0]
      //   while (node != null) {
      //     if (node.url == null) {
      //       // console.log(i);
      //       bkHtml += "<li class=\"bkItem\"><div class=\"folderName\">⮞ " + node.title + "</div><ol class=\"bkFolder\" style=\"list-style-type:none; display:none;\">";
      //       if (node.children.length > 0) {
      //         recurBkList(node.children);
      //       }
      //       bkHtml += "</ol></li>";
      //     } else {
      //       bkHtml += "<li class=\"bkItem\"><a href=\"" + node.url + "\" title=\"" + node.url + "\">" + node.title + "</a></li>";
      //     }
      //     node = bklist[node.index + 1];
      //   }
      // }

      // recurBkList(window.newTab.bookmarklist);
      // document.getElementById("bkList").innerHTML = bkHtml;
      //
      // folderList = document.getElementsByClassName("folderName");
      // for (i = 0; i < folderList.length; i++) {
      //   folderList[i].onclick = function() {
      //     this.nextElementSibling.classList.toggle("hidden");
      //     $(this).next().slideToggle("fast");
      //     this.innerText = this.innerText.replace("⮟", ">");
      //     this.innerText = this.innerText.replace("⮞", "⮟");
      //     this.innerText = this.innerText.replace(">", "⮞");
      //   };
      // }
    }
  });

  //add onclick for like and delete buttons
  $('.like-button').click(function() {
    if ($(this).hasClass('is-active')) {
      removeFav(window.newTab.back);
    } else {
      addFav(window.newTab.back);
    }
    $(this).toggleClass('is-active');
  })

  $('.delete-button').click(function() {
    if (!$(this).hasClass('is-active')) {
      document.getElementById("menu").classList.add("delay");
      $.confirm({
        title: 'Are you sure?',
        content: 'This will remove the background. You can\'t undo this action unless you reset the extension with the reset button in the menu.',
        boxWidth: '25%',
        useBootstrap: false,
        type: 'blue',
        escapeKey: 'cancel',
        theme: 'dark',
        animation: window.newTab.confirmSettings.animation,
        closeAnimation: window.newTab.confirmSettings.animation,
        animateFromElement: false,
        scrollToPreviousElement: false,
        buttons: {
          ok: {
            text: "Remove this background",
            btnClass: 'btn-blue',
            keys: ['enter'],
            action: function() {
              addBlack(window.newTab.back);
              $('.delete-button').addClass('is-active');
              setTimeout(function() {
                document.getElementById("menu").classList.remove("delay")
              }, 250);
            }
          },
          cancel: function() {
            setTimeout(function() {
              document.getElementById("menu").classList.remove("delay")
            }, 250);
          }
        }
      });
    }
  })

  //add onclick for aboutButton
  document.getElementById("aboutButton").onclick = function() {
    document.getElementById("menu").classList.add("delay");
    let manifest = chrome.runtime.getManifest();
    $.confirm({
      title: 'About',
      content: manifest.name + ' ' + manifest.version + '<br>' + manifest.description,
      type: 'blue',
      boxWidth: '25%',
      backgroundDismiss: true,
      useBootstrap: false,
      typeAnimated: true,
      theme: 'dark',
      animation: window.newTab.confirmSettings.animation,
      closeAnimation: window.newTab.confirmSettings.animation,
      animateFromElement: false,
      scrollToPreviousElement: false,
      buttons: {
        support: {
          text: "contact",
          btnClass: 'btn-blue',
          action: function() {
            window.location.href = window.newTab.support_link;
          }
        },

        Close: function() {
          setTimeout(function() {
            document.getElementById("menu").classList.remove("delay")
          }, 250);
        }
      }
    });
  };

  //add onclick for advanced Button
  document.getElementById("advButton").onclick = function() {
    document.getElementById("menu").classList.add("delay");
    $.confirm({
      title: 'Advanced Options',
      content: '<label class="smallswitch" title="Toggles UI and widget animations"><input id="uianiswitch" type="checkbox"><div><span>UI Animations</span></div></label> <br>' +
        '<label class="smallswitch" title="Avoids repeats of backgrounds"><input id="repeatswitch" type="checkbox"><div><span>Avoid Repeats</span></div></label> <br>' +
        '<label class="smallswitch" title="Automatically pause animated backgrounds when tab is inactive to conserve cpu"><input id="autopauseswitch" type="checkbox"><div><span>Auto-Pause Background</span></div></label><br>',
      boxWidth: '30%',
      useBootstrap: false,
      type: 'blue',
      escapeKey: 'Close',
      backgroundDismiss: true,
      theme: 'dark',
      animation: window.newTab.confirmSettings.animation,
      closeAnimation: window.newTab.confirmSettings.animation,
      animateFromElement: false,
      scrollToPreviousElement: false,
      buttons: {
        ok: {
          text: "Reset Data",
          btnClass: 'btn-blue',
          action: function() {
            resetData();
          }
        },
        close: function() {
          setTimeout(function() {
            document.getElementById("menu").classList.remove("delay");
          }, 250);
        }
      },
      onContentReady: function() {
        chrome.storage.local.get({
          animation: true,
          repeat: 'on',
          autopause: true
        }, function(data) {
          document.getElementById("uianiswitch").checked = data.animation;
          document.getElementById("autopauseswitch").checked = data.autopause;
          document.getElementById("repeatswitch").checked = data.repeat;
        });
        document.getElementById("uianiswitch").parentElement.addEventListener('click', function(e) {
          updateUiAni();
          e.preventDefault();
        });
        document.getElementById("autopauseswitch").parentElement.addEventListener('click', function(e) {
          updateAutoPause();
          e.preventDefault();
        });
        document.getElementById("repeatswitch").parentElement.addEventListener('click', function(e) {
          updateRepeat();
          e.preventDefault();
        });
      }
    });
  };

  //prevent right click context menu
  //document.addEventListener('contextmenu', event => event.preventDefault());

  window.newTab.clock.military = false; //set default time and initialize variable

  // Make the elements draggable:
  dragElement(document.getElementById("timeWrapper"));
  dragElement(document.getElementById("searchWrapper"));
  dragElement(document.getElementById("todoWrapper"));
  dragElement(document.getElementById('infoWrapper'));

  //data/settings loading from chrome
  //getting the clock settings
  chrome.storage.local.get({
    time_switch: 'on',
    time_top_data: '',
    time_left_data: '',
    military_switch: 'off'
  }, function(data) {
    if (data.time_switch == 'off') {
      document.getElementById("timeSwitch").checked = false;
      document.getElementById("timeWrapper").classList.add("exit");
      document.getElementById("timeWrapper").classList.add("firstStart");
    } else {
      document.getElementById("timeSwitch").checked = true;
      document.getElementById("timeWrapper").classList.add("entrance");
    }
    if (data.time_top_data != '') {
      document.getElementById("timeWrapper").style.top = data.time_top_data;
    }
    if (data.time_left_data != '') {
      document.getElementById("timeWrapper").style.left = data.time_left_data;
    }
    window.newTab.clock.military = (data.military_switch == 'on');

    startTime(); //start the time
  });

  //getting the info settings
  // chrome.storage.local.get({
  //   info_switch: 'on',
  //   info_top_data: '',
  //   info_left_data: '',
  //   info_mode: 0,
  // }, function(data) {
  //   if (data.info_switch == 'off') {
  //     document.getElementById("infoSwitch").checked = false;
  //     document.getElementById("infoWrapper").classList.add("exit");
  //     document.getElementById("infoWrapper").classList.add("firstStart");
  //   } else {
  //     document.getElementById("infoSwitch").checked = true;
  //     document.getElementById("infoWrapper").classList.add("entrance");
  //   }
  //   if (data.info_top_data != '') {
  //     document.getElementById("infoWrapper").style.top = data.info_top_data;
  //   }
  //   if (data.info_left_data != '') {
  //     document.getElementById("infoWrapper").style.left = data.info_left_data;
  //   }
  //   window.newTab.infoMode = data.info_mode;
  // });

  //getting the searchbar settings
  chrome.storage.local.get({
    search_switch: 'on',
    search_top_data: '',
    search_left_data: '',
    search_engine: 0
  }, function(data) {
    if (data.search_switch == 'off') {
      document.getElementById("searchSwitch").checked = false;
      document.getElementById("searchWrapper").classList.add("exit");
      document.getElementById("searchWrapper").classList.add("firstStart");
    } else {
      document.getElementById("searchSwitch").checked = true;
      document.getElementById("searchWrapper").classList.add("entrance");
    }
    if (data.search_top_data != '') {
      document.getElementById("searchWrapper").style.top = data.search_top_data;
    }
    if (data.search_left_data != '') {
      document.getElementById("searchWrapper").style.left = data.search_left_data;
    }

    let searchInput = $('#searchInput');
    searchInput.parent().attr('action', window.newTab.searchEngines[data.search_engine].action);
    searchInput.attr('data-placeholder', window.newTab.searchEngines[data.search_engine].placeholder);
    searchInput.val(window.newTab.searchEngines[data.search_engine].placeholder);
  });


  //load the background filters
  chrome.storage.local.get({
    filter: [35, 90, 100, 0]
  }, function(data) {
    document.getElementById("darkSlider").value = data.filter[0];
    document.getElementById("satuSlider").value = data.filter[1];
    document.getElementById("conSlider").value = data.filter[2];
    document.getElementById("blurSlider").value = data.filter[3];
    updateFilter();
  });

  // todo list data loading (and parsing list data)
  chrome.storage.local.get({
    todo_switch: 'on',
    todo_top_data: '',
    todo_left_data: '',
    todo_data: ''
  }, function(data) {
    if (data.todo_switch == 'off') {
      document.getElementById("todoSwitch").checked = false;
      document.getElementById("todoWrapper").classList.add("exit");
      document.getElementById("todoWrapper").classList.add("firstStart");
    } else {
      document.getElementById("todoSwitch").checked = true;
      document.getElementById("todoWrapper").classList.add("entrance");
    }
    if (data.todo_top_data != '') {
      document.getElementById("todoWrapper").style.top = data.todo_top_data;
    }
    if (data.todo_left_data != '') {
      document.getElementById("todoWrapper").style.left = data.todo_left_data;
    }
    // console.log("Todo list data loading:" + data.todo_data); //DEBUG
    if (data.todo_data != '') {
      let arr = data.todo_data.split("×");
      for (i = 0; i < arr.length - 1; i++) {
        let li;
        if (arr[i].indexOf("☑") != -1) {
          li = newListItem(String(arr[i]).slice(1), true);
        } else {
          li = newListItem(arr[i], false);
        }
        document.getElementById("myUL").appendChild(li);
      }
    } else {
      document.getElementById("todoInput").style = "";
    }
  });

  //setting the switches click event listeners
  document.getElementById("searchSwitch").parentElement.addEventListener('click', function() {
    updateSearch();
  });
  document.getElementById("searchChange").addEventListener("click", function() {
    changeSearch();
  });
  document.getElementById("timeSwitch").parentElement.addEventListener('click', function() {
    updateTime();
  });
  // document.getElementById("infoSwitch").parentElement.addEventListener('click', function() {
  //   updateinfo();
  // });
  document.getElementById("info").addEventListener("click", function() {
    updateInfoMode();
  });
  // document.getElementById("favSwitch").parentElement.addEventListener('click', function() {
  //   updateFav();
  // });
  document.getElementById("todoSwitch").parentElement.addEventListener('click', function() {
    updateTodo();
  });
  document.getElementById("time").addEventListener("click", function() {
    updateMilitary();
  });
  document.getElementById("darkSlider").addEventListener("input", function() {
    updateFilter();
  });
  document.getElementById("satuSlider").addEventListener("input", function() {
    updateFilter();
  });
  document.getElementById("conSlider").addEventListener("input", function() {
    updateFilter();
  });
  document.getElementById("blurSlider").addEventListener("input", function() {
    updateFilter();
  });

  //window focus and blur listeners
  chrome.tabs.onActivated.addListener(autoPause);


  // makes the list sortable
  $("#myUL").sortable({
    start: function() {
      document.activeElement.blur();
      document.getElementById("myUL").style = "cursor: -webkit-grabbing !important; cursor: grabbing !important;";
    },
    update: function() {
      saveTodo();
    },
    stop: function() {
      document.getElementById("myUL").style = "";
    }
  });

  //sets the placeholders for the inputs that have it
  let inputs = [];
  inputs.push(document.getElementById("todoInput"));
  inputs.push(document.getElementById("searchInput"));
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].value = inputs[i].getAttribute('data-placeholder');
    inputs[i].addEventListener('focus', function() {
      if (this.value == this.getAttribute('data-placeholder')) {
        this.value = '';
      }
    });
    inputs[i].addEventListener('blur', function() {
      if (this.value == '') {
        this.value = this.getAttribute('data-placeholder');
      }
    });
  }

  //when you press enter it pushes to the todo list
  $(".todoInput").on('keyup', function(e) {
    if (e.keyCode == 13) {
      let inputValue = document.getElementById("todoInput").value.trim();
      if (inputValue != '') {
        let li = newListItem(inputValue, false);
        document.getElementById("todoInput").value = "";
        document.getElementById("todoInput").style = "display: none;";
        document.getElementById("myUL").appendChild(li);
        setEndOfContenteditable(li);
        li.focus();
        saveTodo();
      }
    }
  });


let quotes=[

    'I don\'t know what I want, so don\'t ask me /\'Cause I\'m still trying to figure it out',
    'So watch me strike a match on all my wasted time.',
    'I\'ll be strong, I\'ll be wrong, oh but life goes on…',
    ' And when you take, you take the very best of me.',
    'But no one notices until it\'s too late to do anything.',
    'Our song is the slamming screen door, sneakin\' out late, tapping on your window.',
    ' And I don\'t know why, but with you I\'d dance in a storm in my best dress, fearless.',
    'But in your life, you\'ll do things greater than dating the boy on the football team…But I didn\'t know it at fifteen.',
    'I\'ve found time can heal most anything and you just might find who you\'re supposed to be.',
    'Romeo, save me. They\'re trying to tell me how to feel. This love is difficult but it\'s real.',
    'Why are people always leaving? I think you and I should stay the same.',
    'My mistake, I didn\'t know to be in love you had to fight to have the upper hand.',    'this is a big world, that was a small town there in my rear view mirror disappearing now',
    'You\'ve got a smile that could light up this whole town.',
    ' And we know it\'s never simple, never easy. Never a clean break, no one here to save me.',
    'You took a swing, I took it hard. And down here from the ground I see who you are.',
    ' All this time I was wasting, hoping you would come around… I\'ve been giving out chances every time and all you do is let me down.',
    ' And then you feel so low you can\'t feel nothing at all.',
    'It rains when you\'re here and it rains when you\'re gone.',
    'these walls that they put up to hold us back will fall down…',
    'My mind forgets to remind me you\'re a bad idea.',
    'It turns out freedom ain\'t nothing but missing you.',
    ' She floats down the aisle like a pageant queen, but I know you wish it was me… don’t you?',
    'I lived in your chess game, but you changed the rules every day.',
    'I’m shining like fireworks over your sad, empty town.',
    ' Someday I\'ll be living in a big, old city and all you\'re ever gonna be is mean.',
    'I\'d tell you I miss you, but I don\'t know how, I\'ve never heard silence quite this loud.',
    'this is looking like a contest of who can act like they care less. But I liked it better when you were on my side.',
    ' And don\'t lose the way that you dance around in your pj\'s getting ready for school.',
    'this night is sparkling, don\'t you let it go. I\'m wonderstruck, blushing all the way home.',
    '2AM, who do you love?',
    'Your string of lights is still bright to me… Who you are is not where you\'ve been.',
    'today is never too late to be brand new.',
    'You and I walk a fragile line; I have known it all this time. But I never thought I\'d live to see it break.',
    'I don\'t know how to be something you miss.',
    'Bring on all the pretenders. One day, we will be remembered.',
    'We are alone with our changing minds. We fall in love \'til it hurts or bleeds or fades in time.',
    'Love is a ruthless game unless you play it good and right.',
    'He\'s long gone when he\'s next to me and I realize the blame is on me.',
    'No apologies. He\'ll never see you cry. Pretends he doesn\'t know that he\'s the reason why.',
    'the saddest fear comes creeping in - that you never loved me or her, or anyone, or anything...',
    '…That magic\'s not here no more. And I might be OK, but I\'m not fine at all.',
    ' And your mother\'s telling stories about you on a tee ball team. You taught me \'bout your past, thinking your future was me.',
    'I forget about you long enough to forget why I needed to...',
    'Maybe we got lost in translation, maybe I asked for too much. But maybe this thing was a masterpiece \'til you tore it all up. Running scared, I was there, I remember it all too well.',
    'You call me up again just to break me like a promise, so casually cruel in the name of being honest.',
    'time won\'t fly, it\'s like I\'m paralyzed by it. I\'d like to be my old self again, but I\'m still trying to find it.',
    'cause there we are again, when I loved you so. Back before you lost the one, real thing you\'ve ever known.',
    'Now you mail back my things and I walk home alone / But you keep my old scarf from that very first week, \'cause it reminds you of innocence and it smells like me.',
    'We\'re happy, free, confused, and lonely at the same time. It\'s miserable and magical.',
    'I wish I could run to you. And I hope you know that every time I don\'t I almost do.',
    'You wear your best apology, but I was there to watch you leave.',
    'But sometimes I wonder how you think about it now.',
    'But I don’t wanna dance if I’m not dancing with you.',
    'Words, how little they mean when you\'re a little too late.',
    '“And they tell you that you’re lucky, but you’re so confused, \'cause you don’t feel pretty, you just feel used.',
    'I\'ve been spending the last eight months thinking all love ever does is break and burn and end…',
    'And what do you do when the one who means the most to you is the one who didn\'t show?',
    'Your close friends always seem to know / When there\'s something really wrong',
    'You called me later / And said, \'I\'m sorry I didn\'t make it\' / And I said, \'I\'m sorry, too\'',
    'Loving him is like driving a new Maserati down a dead-end street / Faster than the wind, passionate as sin, ending so suddenly',
    'the lights are so bright, but they never blind me.',
    'Love\'s a game, wanna play?',
    'But you\'ll come back each time you leave \'cause darling, I\'m a nightmare dressed like a daydream.',
    'When we go crashing down, we come back every time \'cause we never go out of style.',
    'I got that red lip, classic thing that you like.',
    'the rest of the world was black and white, but we were in screaming color.',
    'the more I think about it now, the less I know, all I know is that you drove us off the road.',
    'People like you always want back the love they pushed aside, but people like me are gone forever when you say goodbye.',
    'Why\'d you have to go and lock me out when I let you in?',
    'While you\'ve been getting down and out about the liars and the dirty, dirty cheats of the world… You could\'ve been getting down to this sick beat.',
    'We\'re a crooked love in a straight line down.',
    ' And I wish you knew that I miss you too much to be mad anymore.',
    'You give me everything and nothing.',
    'Makes you wanna run and hide, but it made us turn right back around.',
    'Band-aids don\'t fix bullet holes. You say sorry just for show.',
    ' Someday when you leave me, I bet these memories follow you around.',
    'When you\'re young, you just run, but you come back to what you need.',
    'this love left a permanent mark.',
    'Your kiss, my cheek / I watch you leave / Your smile, my ghost / I fall to my knees',
    'It was months and months of back and forth, you\'re still all over me like a wine-stained dress I can\'t wear anymore.',
    'When I was drowning that\'s when I could finally breathe.',
    'Just because you\'re clean, don\'t mean you don\'t miss it.',
    'didn\'t it all seem new and exciting? …It\'s all fun and games \'til somebody loses their mind.',
    'You search the world for something else to make you feel like what we had. And in the end in wonderland, we both went mad.',
    'Heartbreak is the national anthem, we sing it proudly.',
    'they\'ll take their shots, but we are bulletproof.',
    ' So I punched a hole in the roof / Let the flood carry away all my pictures of you.',
    'When all you wanted / Was to be wanted / Wish you could go back / And tell yourself what you know now',
    '32 and still growing up now / Who you are is not what you did / You’re still an innocent',
    'We play dumb / But we know exactly what we\'re doing',
    'Please don\'t ever become a stranger whose laugh I could recognize anywhere',
    'Can we always be this close forever and ever?',
    'I\'m only seventeen / I don\'t know anything but I know I miss you',
    'I was walking home on broken cobblestones just thinking of you, when she pulled up like a figment of my worst intentions',
    'You play stupid games, you win stupid prizes',
    'I had a marvelous time ruining everything',
    'Untouchable, burning brighter than the sun / And when you’re close I feel like coming undone',
    'Barefoot in the kitchen / Sacred new beginnings / That became my religion, listen',
    'I could build a castle out of all the bricks they threw at me',
    'Cold was the steel of my axe to grind for the boys who broke my heart / Now I send their babies presents',
    'He says he\'s so in love / He\'s finally got it right / I wonder if he knows he\'s all I think about at night',
    'Back when you fit in my poems like a perfect rhyme',
    'I once believed love would be burning red / But it\'s golden',
    'I think I\'ve seen this film before / And I didn\'t like the ending / You\'re not my homeland anymore / So what am I defending now?',
    'He said the way my blue eyes shined / Put those Georgia stars to shame that night / I said, \'that\'s a lie',
    'the monsters turned out to be just trees / When the sun came up you were looking at me',
    'the night you danced like you knew our lives would never be the same / You held your head like a hero / On a history book page / It was the end of a decade / But the start of an age',
    'I can\'t decide if it\'s a choice: Getting swept away',
    'they told me all of my cages were mental / So I got wasted like all my potential',
    'But she wears short skirts / I wear T-shirts / She\'s cheer captain / And I\'m on the bleachers',
    'I don\'t like that falling feels like flying till the bone crush.',
    'I\'m doing good, I\'m on some new shit / Been saying \'yes\' instead of \'no\' / I thought I saw you at the bus stop, I didn\'t though',
    'I guess you never know, never know / And if you wanted me, you really should\'ve showed',
    'I persist and resist the temptation to ask you / If one thing had been different / Would everything be different today?',
    'When you are young they assume you know nothing',
    'You drew stars around my scars / But now I\'m bleedin',
    'I knew you\'d miss me once the thrill expired / And you\'d be standin\' in my front porch light / And I knew you\'d come back to me',
    'You wear the same jewels that I gave you, as you bury me',
    'We gather stones, never knowing what they\'ll mean / Some to throw, some to make a diamond ring',
    'You know I didn\'t want to have to haunt you / But what a ghostly scene',
    'do you remember when I pulled up and said \'get in the car\' / And then cancelled my plans just in case you called',
    'to live for the hope of it all / Cancel plans just in case you\'d call / And say, \'Meet me behind the mall\'',
    'Bold was the waitress on our three-year trip / Getting lunch down by the Lakes / She said I looked like an American singer',
    'time, mystical time / Cutting me open, then healing me fine / Were there clues I didn\'t see?',
    'One single thread of gold tied me to you',
    'I know where it all where wrong, your favorite song was playing from the far side of the gym / I was nowhere to be found I hate the crowds / Plus I saw you dance with him',
    'Knew I was a robber first time that he saw me / Stealing hearts and running off and never sayin\' sorry',
    'I swear I don\'t love the drama, it loves me',
    'I bury hatchets, but I keep maps of where I put \'em',
    'Love made me crazy, if it doesn\'t, you ain\'t doin\' it right',
    'My name is whatever you decide / And I\'m just gonna call you mine',
    'Handsome, you\'re a mansion with a view',
    'Sometimes I wonder when you sleep / Are you ever dreaming of me?',
    'the world goes on another day, another drama / But not for me, all I think about is karma.',
    'I\'ve got a list of names and yours is in red, underlined / I check it once, then I check it twice',
    'You asked me for a place to sleep, locked me out and threw a feast',
    'You know I\'m not a bad girl, but I / Do bad things with you',
    'You did a number on me but, honestly, baby, who\'s counting?',
    'Ocean blue eyes looking in mine / I feel like I might sink and drown and die',
    'You make me so happy it turns back to sad / There\'s nothing I hate more than what I can\'t have / And you are so gorgeous it makes me so mad',
    'We were jet-set, Bonnie and Clyde / Until I switched to the other side / It\'s no surprise I turned you in / \'cause us traitors never win',
    'We met a few weeks ago / Now you try on callin\' me \'Baby\' like tryin\' on clothes',
    'Your love is a secret I\'m hoping, dreaming, dying to keep',
    'Is this the end of all the endings? / My broken bones are mending',
    'I loved you in spite of deep fears that the world would divide us',
    'but I\'m the mess that you wanted',
    'But you stabbed me in the back while shaking my hand / And therein lies the issue / Friends don\'t try to trick you / Get you on the phone and mind-twist you / So I took an axe to a mended fence',
    'I brought a knife to a gunfight',
    'He built a fire just to keep me warm',
    'I want to wear his initial on a chain round my neck, not because he owns me, but cause he really knows me, which is more than they can say',
    'Holding my breath, slowly, I said \'You don\'t need to save me, but would you run away with me?\'',
    'Would\'ve been right there, front row even if nobody came to your show',
    'I\'m always waiting for you to be waiting below',
    'devils roll the dice, angels roll their eyes / What doesn\'t kill me makes me want you more',
    'I don\'t wanna keep secrets just to keep you',
    'I\'m drunk in the back of the car / And I cried like a baby coming home from the bar / Said, \'I\'m fine,\' but it wasn\'t true',
    'For whatever it\'s worth, I love you, ain\'t that the worst thing you ever heard?',
    'I\'ve got a hundred thrown-out speeches I almost said to you',
    'I am an architect, I\'m drawing up the plans',
    'I\'ll never let you go \'cause I know this is a fight that someday we\'re gonna win',
    'I\'m with you even if it makes me blue',
    'Without all the exes, fights, and flaws, we wouldn\'t be standing here so tall',
    'We were a fresh page on the desk, filling in the blanks as we go',
    'We were in the backseat drunk on something stronger than the drinks in the bar',
    'If the story is over, why am I still writing pages?',
    'I ask the traffic lights if it will be alright, they say I don\'t know.',
    'they say home is where the heart is, but that\'s not where mine lives',
    'I pinned your hands behind your back / Thought I had reason to attack, but no',
    'Fighting with a true love is boxing with no gloves / Chemistry \'til it blows up, \'til there’s no us',
    'And I can\'t talk to you when you\'re like this, staring out the window like I’m not your favorite town',
    'they say the road gets hard and you get lost',
    'remember how I said I\'d die for you?',
    'I come back stronger than a \'90s trend',
    'Wait for the signal, and I\'ll meet you after dark / Show me the places where the others gave you scars',
    'Bustling crowds or silent sleepers / You\'re not sure which is worse',
    'You told your family for a reason / You couldn\'t keep it in / Your sister splashed out on the bottle',
    'this dorm was once a madhouse\' I made a joke, \'Well, it\'s made for me\'',
    'One for the money, two for the show / I never was ready so I watch you go',
    'Sometimes you just don\'t know the answer \'til someone\'s on their knees and asks you',
    'I can\'t dare to dream about you anymore',
    'My mind turns your life into folklore / I can\'t dare to dream about you anymore',
    'I parked my car right between the Methodist and thе school that used to be ours',
    'I\'ll go back to L.A. and the so-called friends who\'ll write books about me if I ever make it and wonder about the only soul who can tell which smiles I\'m fakin',
    'What would you do if I break free and leave us in ruins, took this dagger in me and removed it, gain the weight of you then loose it?',
    'I made you my temple, my mural, my sky. Now I\'m begging for footnotes in the story of your life / Drawing hearts in the byline always taking up too much space or time',
    'Your nemesis will defeat themselves before you get the chance to swing',
    'My waves meet your shore ever and evermore',
    'I replay my footsteps on each stepping stone, trying to find the one where I went wrong',
    'So yeah, it\'s a fire, it\'s a goddamn blaze in the dark and you\'ve started it / So yeah, it\'s a war, it\'s the goddamn fight of my life and you started it',
    'did you ever hear about the girl who got frozen? / Time went on for everybody else, she won\'t know it / She\'s still twenty-three inside her fantasy',
    'Breaking down and coming undone / It\'s a rollercoaster kind of rush',
    'He can\'t see the smile I\'m faking and my heart\'s not breaking \'cause I\'m not feeling anything at all',
    'Well, I like the way your hair falls in your face / You got the keys to me / I love each freckle on your face',
    'With your face and the beautiful eyes / And the conversation with the little white lies / And the faded picture of a beautiful night',
    'Never be so kind / You forget to be clever / Never be so clever / You forget to be kind',
    'When you think Tim McGraw, I hope you think of me.'


];


// let btn=document.querySelector('.btn');
// btn.addEventListener('click', displayQuote);

function displayQuote(){
    //create an index of a random number
    //convert it into between 0 to length of quotes[]
    let index=Math.floor(Math.random()*quotes.length);

    //display the quote of that index
    let div=document.querySelector('#quote');
    let quote=`<div class="card"><p>${quotes[index]}</p></div>`;
    div.innerHTML=quote;
}
    displayQuote();

//$("checkbox").click(function(){
//  $("qcontainer").toggle("show");
//});


jQuery(document).ready(function(){
    jQuery('#hidequote').on('click', function(event) {
        jQuery('#content2').toggle('show');
    });
});
});
