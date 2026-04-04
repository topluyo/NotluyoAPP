
/** source\Library.js  **/
function GetStyle(className) {
	var cssText = "";
	for (var i = 0; i < document.styleSheets.length; i++) {
		if ( document.styleSheets[i].href && !document.styleSheets[i].href.startsWith(location.origin)) continue;
		var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
		for (var x = 0; x < rules.length; x++) {
			if (rules[x].selectorText == className) {
				cssText += rules[x].style.cssText;
			}
		}
	}
	var cssObject = {};
	cssText.split(";").forEach(function (rule) {
		var rule = rule.trim();
		if (rule.length == 0) return;
		var parts = rule.split(":");
		var key = parts[0].trim();
		var value = parts[1].trim();
		cssObject[key] = value;
	})
	return cssObject;
}


//------ COLORS ------//
const Color={
	/**
	 * Return black or white color depending on the luminance of the given color.
	 */
	inverseColor(hex){
		var rgb = this.hexToRgb(hex);
		var luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
		return luminance > 156 ? "#000" : "#FFF"; // 128 is the threshold
	},
	lightColor(hex,percent){
		var rgb = this.hexToRgb(hex);
		var r = rgb[0];
		var g = rgb[1];
		var b = rgb[2];
		return this.rgbToHex(Math.round((255-r)*percent)+r, Math.round((255-g)*percent)+g, Math.round((255-b)*percent)+b);
	},
	darkColor(hex,percent){
		var rgb = this.hexToRgb(hex);
		var r = rgb[0];
		var g = rgb[1];
		var b = rgb[2];
		return this.rgbToHex(Math.round(r*percent), Math.round(g*percent), Math.round(b*percent));
	},
	hexToRgb(hex) {
		hex=hex.toLowerCase().trim();
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	},
	rgbToHex(r, g, b) {
		return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
	},
	componentToHex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
}

Element.prototype.hide = function () {
	this.style.display = "none";
}
Element.prototype.show = function () {
	this.style.display = null;
}
Element.prototype.toggle = function () {
	this.style.display = this.style.display == "none" ? null : "none";
}
Element.prototype.empty = function () {
	while (this.firstChild) {
		this.removeChild(this.firstChild);
	}
}
Element.prototype.parents = function () {
	var parents = [];
	var el = this;
	while (el!=document.documentElement) {
		parents.push(el.parentNode);
		el = el.parentNode;
	}
	return parents;
}
/** source\OnAdded.js  **/
// OnAdded
function OnAdded(selector, process, order) {}
function OnceAdded(selector, process, order) {}
function OnChildAdded(el, selector, process, order=0) {}

(function () {

	let triggers = []

	window.OnAdded = function (selector, process, order) {
		triggers.push({
			selector,
			process,
			order,
			type: 'on'
		});
	}

	window.OnceAdded = function (selector, process, order) {
		triggers.push({
			selector,
			process,
			order,
			type: 'once'
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		function Check(nodes) {
			for (const node of nodes) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					for (const trigger of triggers) {
						let selector = trigger.selector;
						if (node.matches(selector)) trigger.process.apply(node, [node]);
						if (node.querySelectorAll(selector).length > 0) {
							for (const el of node.querySelectorAll(selector)) {
								trigger.process.apply(el, [el]);
								if(trigger.type==='once'){
									triggers.splice(triggers.indexOf(trigger), 1);
								}
							}
						}
					}
				}
			}
		}

		var observer = new MutationObserver((mutations) => {
			mutations = mutations.sort((a, b) => {
				return b.type.localeCompare(a.type)
			})
			for (const m of mutations) {
				if (m.type == "childList") {
					let nodes = m.addedNodes;
					Check(nodes);
				}
			}
		});
		observer.observe(document.documentElement, {
			childList: true,
			subtree: true
		});
		Check([document.documentElement]);
	})


	window.OnChildAdded = function (element,selector, process ) {
		function Check(nodes) {
			for (const node of nodes) {
				if(node.nodeType===Node.ELEMENT_NODE){
					if (node.matches(selector)) process.apply(node, [node]);
					if (node.querySelectorAll(selector).length > 0) {
						for (const el of node.querySelectorAll(selector)) {
							process.apply(el, [el]);
						}
					}
				}
			}
		}

		var observer = new MutationObserver((mutations) => {
			mutations = mutations.sort((a, b) => {
				return b.type.localeCompare(a.type)
			})
			for (const m of mutations) {
				if (m.type == "childList") {
					let nodes = m.addedNodes;
					Check(nodes);
				}
			}
		});
		observer.observe(element, {
			childList: true,
			subtree: true
		});
		Check([element]);
	}



})()


var Emitter = function (obj) {
	let triggers = [];
	obj.on = function (event, process, order=0) {
		triggers.push({
			event,
			process,
			order,
			type: 'on'
		});
	}
	obj.once = function (event, process, order=0) {
		triggers.push({
			event,
			process,
			order,
			type: 'once'
		});
	}
	obj.emit = function (event, ...args) {
		for (const trigger of triggers) {
			if (trigger.event == event) {
				trigger.process.apply(obj, args);
				if (trigger.type == 'once') {
					triggers.splice(triggers.indexOf(trigger), 1);
				}
			}
		}
	}
}
/** source\SortableGrid.js  **/
/**
 * @param {Element} el
 * @param {{useCloser:boolean,items:string}} config
 */
 function SortableGrid(el,config={}){
  if(el._isCreated) return;
  if(el._isClone) return;

  

  let cloneParent;

  function CreateCloneParent(){
    cloneParent = el.cloneNode(false);
    cloneParent._isCreated = true;
    cloneParent._isClone = true;
    cloneParent.style.opacity = "0";
    cloneParent.style.zIndex = "-1";
    cloneParent.style.position = "absolute";
    el.parentElement.appendChild(cloneParent);  
  }

  function RemoveCloneParent(){
    if(cloneParent) cloneParent.remove()
    cloneParent=null
  }

  



  config = Object.assign({items:".sortable-grid__item",useCloser:false},config);

  let base = {};
  el.sortableGrid = base;

  if( getComputedStyle(el).position == "static" || getComputedStyle(el.parentElement).position == "static" ){
    el.style.position = "relative";
    el.parentElement.style.position = "relative";
  }


  function Closer(item){
    if(item._closer) return;
    let closer = document.createElement("div");
    closer.classList.add("sortable-grid__closer");
    closer.style.position = "absolute";
    closer.style.top = "0";
    closer.style.left = "0";
    closer.style.width = "100%";
    closer.style.height = "100%";
    closer.style.zIndex = "1";
    closer.style.opacity = "0";
    closer.style.display = "none";
    item._closer = closer;
    item.appendChild(closer);
    base.enabled = base.enabled;
  }
  
  
  



  Object.defineProperty(base,"items",{
    get:function(){
      return Array.from(el.querySelectorAll(config.items)).filter(e=>e._isClone!=true);
    }
  })

  let enabled = true;

  Object.defineProperty(base,"enabled",{
    get:function(){
      return enabled;
    },
    set:function(v){
      enabled = v;
      for(let item of base.items){
        item.style.touchAction = enabled ? "none" : null;
        Closer(item);
        item._closer.style.touchAction = enabled ? "none" : null;
        item._closer.style.cursor = enabled ? "move" : null;
        item._closer.style.display = config.useCloser && enabled ? "block" : "none";
      }

      if(base.update) base.update();
    }
  });
  base.enabled = true;






  let dragging=false;
  let downRectX,downRectY;
  let downX =0;
  let downY =0;
  let draggingItem = null;

  document.addEventListener("pointerdown",function(e){
    if(base.enabled==false) return;
    // if not mouse button 1 return
    if(e.button!=0) return;
    let founded = false
    let parents = [],parent = e.target;
    while(parent!=document.documentElement){
      parents.push(parent);
      parent = parent.parentElement;
    }
    for(let i=0;i<parents.length;i++){
      if(base.items.indexOf(parents[i]) !== -1){
        founded = true;
        draggingItem = parents[i];
        break;
      }
    }
    if(!founded){ return; }
    CreateCloneParent();
    e.preventDefault();
    e.stopPropagation();
    downX = e.clientX;
    downY = e.clientY;
    let rect = el.getBoundingClientRect();
    downRectX = rect.left;
    downRectY = rect.top;
    e.dx = 0;
    e.dy = 0;
    dragging = true;

    base.items.forEach( i =>i.style.transition= i!=draggingItem ? "all .2s linear" : "none" );
    base.items.forEach( i =>i.style.touchAction = "none"  );
    onPress.call(this,e);
  })

  document.addEventListener("pointermove",function(e){
    if(!dragging || draggingItem==null) return;
    e.preventDefault();
    e.stopPropagation();
    let rect = el.getBoundingClientRect();

    e.dx = e.clientX - downX + downRectX - rect.left;
    e.dy = e.clientY - downY + downRectY - rect.top;

    // limit drag of parent element
    if( e.dx < - draggingItem.offsetLeft ){
      e.dx = - draggingItem.offsetLeft;
    }
    if(e.dx + draggingItem.offsetLeft > rect.width - draggingItem.offsetWidth){
      e.dx = rect.width -  draggingItem.offsetWidth - draggingItem.offsetLeft;
    }
    if( e.dy < - draggingItem.offsetTop ){
      e.dy = - draggingItem.offsetTop;
    }
    if(e.dy + draggingItem.offsetTop > rect.height - draggingItem.offsetHeight){
      e.dy = rect.height -  draggingItem.offsetHeight - draggingItem.offsetTop;
    }

    draggingItem.style.transform = "translate("+e.dx+"px,"+e.dy+"px)";
    onDrag.call(this,e);
  })

  document.addEventListener("pointerup",function(e){
    if(!dragging) return
    e.preventDefault();
    e.stopPropagation();
    onRelease.call(this,e);
    dragging=false;

    RemoveCloneParent();
    base.items.forEach(e=>{e.style.transform=null ; e.style.transition=null; e.style.touchAction = null });
  })

  document.addEventListener("resize",function(e){
    base.update();
  })


  let startedItemOrder = [];

  function onPress(e){
    if(!base.enabled) return false;
    base.update();
    base.transformUpdate(base.items);
    draggingItem._zIndex = draggingItem.style.zIndex;
    let zIndex = getComputedStyle(draggingItem).zIndex
    if(zIndex=="auto") zIndex = 0;
    draggingItem.style.zIndex = zIndex+1;
    startedItemOrder = base.items.map(e=>e);
  }


  /* Nearest item from element  */
  function nearestIndex(el){
    let items = base.items;
    let nearest = null;
    let nearestIndex = -1;
    let nearestDistance = null;
    for(let i=0;i<items.length;i++){
      let item = items[i];
      let distance = Math.sqrt( Math.pow(item.cy - el.ny ,2) + Math.pow(item.cx - el.nx ,2) );
      if(nearestDistance === null || distance < nearestDistance){
        nearest = item;
        nearestIndex = i;
        nearestDistance = distance;
      }
    }
    return nearestIndex;
  }

  let transformedList;
  function onDrag(e){
    draggingItem.nx = draggingItem.offsetLeft + draggingItem.offsetWidth/2 + e.dx
    draggingItem.ny = draggingItem.offsetTop + draggingItem.offsetHeight/2 + e.dy
    let nearest = nearestIndex(draggingItem);
    transformedList = base.items.map(e=>e).filter(e=>e!=draggingItem) ;
    transformedList.splice(nearest,0,draggingItem);
    base.transformUpdate(transformedList);
  }

  
  function onRelease(e){
    if(draggingItem) draggingItem.style.zIndex = draggingItem._zIndex;
    draggingItem = null;
    base.transformUpdate(transformedList)
    for(let i=0;i<transformedList.length;i++){
      let item = transformedList[i];
      item.style.transform = null;
      el.removeChild(item);
      el.appendChild(item);
    }
    // Remove all empty TextNodes
    el.normalize();

    // Beatify Code
    let parentNodeCodeSpace = "\n" + "\t"
    if(el.previousSibling) parentNodeCodeSpace = el.previousSibling.textContent + "\t";
    for(let node of el.childNodes){
      if(node instanceof Text ) el.removeChild(node);
    }
    for(let element of el.children){
      el.insertBefore(new Text(parentNodeCodeSpace),element);
    }
    el.appendChild(new Text(parentNodeCodeSpace.substring(0,parentNodeCodeSpace.length-1)));
    base.update();
    if(base.items.some((e,i)=>e!=startedItemOrder[i])){
      if(base.onSorted) base.onSorted(base.items);
    }
  }

  base.update = function(){
    base.rect = el.getBoundingClientRect();
    base.items.forEach(function(item,index){

      Closer(item);
      item._isCreated = true;
      // Calc coordinates from parent
      let x = item.offsetLeft;
      let y = item.offsetTop;
      let w = item.offsetWidth;
      let h = item.offsetHeight;


      item.x = parseInt( x );
      item.y = parseInt( y );
      item.w = parseInt( w );
      item.h = parseInt( h );

      item.cx = item.x + item.w/2;
      item.cy = item.y + item.h/2;
      
      // Debug
      // item.innerText = "Item  " + item.x + "," + item.y;


      item.style.transform = null;
    })





    let rect = el.getBoundingClientRect();
    if(cloneParent){
      cloneParent.style.left = rect.left + "px";
      cloneParent.style.top = rect.top + "px";
      cloneParent.style.width = rect.width + "px";
      cloneParent.style.height = rect.height + "px";
      cloneParent.empty()
      // clone items
      for(let i=0;i<base.items.length;i++){
        let item = base.items[i];
        let cloneItem = item.cloneNode(true);
        cloneItem.classList.remove(config.items);
        cloneItem._isCreated = true;
        cloneItem._isClone = true;
        cloneItem._real_item = item;
        item._clone_item = cloneItem;
        
        cloneItem.style.transform = "translate3d(0,0,0)";
        cloneParent.appendChild(cloneItem);
      }
    }
  }
 
  




  base.transformUpdate = function(list){

    if(list==null) list = base.items; 

    if(cloneParent){
      for(let i=0;i<list.length;i++){
        cloneParent.appendChild(list[i]._clone_item );
      }
  
      // calc new positions
      for(let i=0;i<cloneParent.children.length;i++){
        let cloneItem = cloneParent.children[i];
        let realItem = cloneItem._real_item;
        if(realItem == draggingItem) continue;
        
        let newX = cloneItem.offsetLeft - realItem.offsetLeft
        let newY = cloneItem.offsetTop - realItem.offsetTop
  
        realItem.style.transform = `translate3d(${newX}px,${newY}px,0)`;
        
      }
    }
  }

  
  base.update();
  
  base.transformUpdate(base.items);
  for(let i=0;i<base.items.length;i++){
    let item = base.items[i];
    item.style.transform = null;
  }




  OnChildAdded(el, config.items ,function(item){
    if(item._isCreated) return;
    base.update();
  })


  return base;
}

OnAdded(".sortable-grid",(el)=> SortableGrid(el) );


/** source\Bord\Base.js  **/
Bord.Base = Bord.Base || {};

// TODO: Add Event Listeners, Emitter

Bord.Base.Keyboard = function (bord) {
  console.log(bord)
  bord.keyboard = {}
  /** @type {[{key:string,event:Function}]} */
  bord.keyboard.listeners = []
  window.addEventListener("keydown",function(e){
    let keyCode = e.code
    if(e.ctrlKey) keyCode = "Ctrl-"+keyCode
    if(e.shiftKey) keyCode = "Shift-"+keyCode
    if(e.altKey) keyCode = "Alt-"+keyCode
    if(e.metaKey) keyCode = "Meta-"+keyCode

    // Exit When Text Typing
    if(e.target.tagName=="INPUT"||e.target.tagName=="TEXTAREA"){
      return
    }
    // Exit When Focus is on a contenteditable element
    if(e.target.contentEditable=="true"){
      return
    }

    console.log(keyCode)
    for(let i=0;i<bord.keyboard.listeners.length;i++){
      let listener = bord.keyboard.listeners[i]
      if(listener.key==keyCode){
        listener.event(e)
        e.preventDefault()
      }
    }
    document.querySelectorAll('[key="'+keyCode+'"]').forEach(function(el){
      if(el.onclick) el.onclick(e)
      e.preventDefault()
    })

  })
}


/** source\Bord\Bord.js  **/
Bord.Init = function(filePath){
  let bord = {}
  Bord.Bord.call(bord,filePath)
  return bord;
}

window.addEventListener('beforeunload', (event) => {
  event.returnValue = `Are you sure you want to leave?`;
});
/** source\Bord\Test.js  **/
TEST_MODE=true;
const Test = {
  tests: [],
  add:function(name,fn,response){
    this.tests.push({name:name,fn:fn,response:response});
    this[name] = fn;
  },
  play:function(name){
    for(var i=0;i < this.tests.length;i++){
      if(this.tests[i].name==name){
        let test = this.tests[i];
        if( test.fn() == test.response ){
          console.log(test.name+" passed");
        }else{
          console.log(test.name+" failed");
        }
      }
    }
  },
  equal:function(a,b,name){
    var show=true;
    // Deep compare two objects
    if(a === b){
      if(name) console.log("%c✓ "+name+" passed","color:green",show?a:"");
      return true;
    }
    if(a == null || b == null){
      if(name) console.log("%c× "+name+" failed","color:red", a , b );
      return false;
    }
    if(a.constructor !== b.constructor){
      if(name) console.log("%c× "+name+" failed","color:red", a , b );
      return false;
    }
    if(a.constructor === Array){
      if(a.length != b.length){
        if(name) console.log("%c× "+name+" failed","color:red", a , b );
        return false;
      }
      for(var i=0;i < a.length;i++){
        if(!this.equal(a[i],b[i])){
          if(name) console.log("%c× "+name+" failed","color:red", a , b );
          return false;
        }
      }
      if(name) console.log("%c✓ "+name+" passed","color:green",show?a:"");
      return true;
    }
    if(a.constructor === Object){
      for(var i in a){
        if(!this.equal(a[i],b[i])){
          if(name) console.log("%c× "+name+" failed","color:red", a , b );
          return false;
        }
      }
      if(name) console.log("%c✓ "+name+" passed","color:green",show?a:"");
      return true;
    }
    if(name) console.log("%c× "+name+" failed","color:red", a , b );
    return false;
  }
  
}


Test.add("vision-cameraPosition",function(){
  vision.camera.x = 100;
  vision.camera.y = 100;
  vision.camera.s = 5;
  vision.camera.render();
})

Test.add("vision-zoomToAnimation",function(){
  let startTime = new Date().getTime();

  function easeInOutCubic(x){
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  } 
  function animation() {
    let now = new Date().getTime();
    let elapsed = now - startTime;
    let progress = elapsed / 5000;
    if(progress > 1){
      progress = 1;
    }else{
      requestAnimationFrame(animation);
    }
    vision.camera.zoomLerp(0,0,0.1,960,540,50,easeInOutCubic(progress));
  }
  animation();
})


Test.add("vision-zoomOutAnimation",function(){
  let startTime = new Date().getTime();

  function easeInOutCubic(x){
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  } 
  function animation() {
    let now = new Date().getTime();
    let elapsed = now - startTime;
    let progress = elapsed / 20000;
    if(progress > 1){
      progress = 1;
    }else{
      requestAnimationFrame(animation);
    }
    vision.camera.zoomLerp(vision.camera.x,vision.camera.y,0.03,vision.camera.x,vision.camera.y,10**30,easeInOutCubic(progress));
  }
  animation();
})



Test.add("vision_focus_animation",function(start=0,to=5,time=20){
  let startScale = vision.camera.s * (10**start);
  let targetScale = vision.camera.s * (10**to);
  let startTime = new Date().getTime();
  function easeInOutCubic(x){
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  } 
  function animation() {
    let now = new Date().getTime();
    let elapsed = now - startTime;
    let progress = elapsed / (time*1000);
    if(progress > 1){
      progress = 1;
    }else{
      requestAnimationFrame(animation);
    }
    vision.camera.zoomLerp(vision.camera.x,vision.camera.y,startScale,vision.camera.x,vision.camera.y,targetScale,easeInOutCubic(progress));
  }
  animation();
})




Test.add("vision-transform-NormalizeSquare",function(){
  var points = [
    {x:0,y:0},
    {x:200,y:100}
  ]
  var normalized=Bord.Vision.Transform.NormalizeSquare(points,1)
  var normalized1000=Bord.Vision.Transform.NormalizeSquare(points,1000)
  console.log("Points:",points)
  console.log("NormalizedSquare:", normalized)
  console.log("NormalizedSquare1000",normalized1000)

})
/** source\Bord\Animation\Animation.js  **/
Bord.Animation = {}
Bord.Animation.PlayBackBord = function (bord,time) {
  var drawings = bord.vision.findItemsInBound(bord.vision.camera.bound()).drawings
  return Bord.Animation.Write(drawings,time)
}

Bord.Animation.SortDrawings = function (drawings) {
  drawings = drawings.sort((a,b)=> a.data.m[5] - b.data.m[5] + a.data.m[4] - b.data.m[4]  )
  drawings.forEach(e=>{
    e.parentElement.appendChild(e)
  })
}

Bord.Animation.Write = function (drawings,time) {

  // TODO: Sort Items by x to y 
  // drawings = drawings.sort((a,b)=> a.data.m[5] - b.data.m[5] + a.data.m[4] - b.data.m[4]  )

  // TODO: Calc Times
  let averageScale = drawings.reduce((a,b)=>a+(b.data.m[0]+a+b.data.m[3])/drawings.length,0)

  

  let lengths = drawings.map(e=> (e.data.m[0] + e.data.m[3]) / averageScale)

  let totalLength = lengths.reduce((a,b)=>a+b,0)

  // times: Animation Start Times
  let times = [], currentTime = 0;
  for(let i=0;i<lengths.length;i++){
    let localTime = lengths[i] / totalLength
    times.push(currentTime)
    currentTime += localTime
  }
  // durations:  Animation Durations
  let durations = times.map((e,i)=>{
    if(i!=times.length-1){
      return times[i+1] - times[i]
    }else{
      return 1 - times[i]
    }
  });
  
  let animation = {
    state: true,
    exit : false,
    stop:function(){
      this.state = false
      this.exit = true
    },
    play:function(){
      this.state = true
      this.lastTime = Date.now()
      requestAnimationFrame(this.frame.bind(this))
    },
    pause:function(){
      this.state = false
    },
    lastTime : new Date().getTime(),
    elapsed  : 0,
    frame    : function(_t_) {
      if(this.state==false && this.exit==false) return

      let nowTime = new Date().getTime();
      let deltaTime = nowTime - this.lastTime;
      this.elapsed = this.elapsed + deltaTime;
      this.lastTime = nowTime;
  
      let t = this.elapsed / (time);
      if(t > 1){
        t = 1;
      }else{
        if(this.exit==false && this.state==true){
          requestAnimationFrame(this.frame.bind(this));
        }
      }
      if(_t_==0) t=0 
      if(this.exit) t=1;
  
      let isFirst = true;
      for(let i=0;i<drawings.length;i++){
        let drawing = drawings[i];
        let start = times[i];
        if(start + durations[i] < t){
          drawing.style.display=null
          drawing.style.strokeDashoffset = null
          drawing.style.strokeDasharray = null
        }else if(isFirst){
          let k = (t-start) / durations[i]
          let len = drawing.getTotalLength()
          let p = len * k
          drawing.style.display='block'
          //drawing.pathLength = 1
          drawing.setAttribute('pathLength',1)
          drawing.style.strokeDasharray = 1
          drawing.style.strokeDashoffset = 1-k
          isFirst=false
        }else{
          //drawings[i].draw(progress - t)
          drawing.style.display='none'
        }
      }
      
    }
  }

  animation.frame(0);

  return animation;
  /*
  let lengths = drawings.map(e=>e.getTotalLength())
  // total lengst
  let totalLength = lengths.reduce((a,b)=>a+b)
  // item animation time
  let times = [],currentTotal = 0;
  for(let i=0;i<lengths.length;i++){
    var localTime = lengths[i]/totalLength
    times.push(localTime)
    currentTotal += localTime
  }
  */


}
/** source\Bord\Assistant\Assistant.js  **/
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;



Bord.Assistant = Bord.Assistant || (Bord.Assistant={})



const Assistant = {
	name: "Einstein",
	elements:{
		parent:document.createElement('div'),
		panel:document.createElement('div'),
		title:document.createElement('h1'),
		image:document.createElement('img'),
		description:document.createElement('p'),
		subtitle:document.createElement("div"),
		translateSubtitle:document.createElement("div"),
		face:document.createElement("div"),
		speak:document.createElement("div"),
	},
	transcripts:[],
	transcript:"",
	results:[],
	text: "",
	listen: "",
	listenIndex: 0,
	fullTranscript: "",
	fullTranscriptIndex: 0,
	checkedList:[], 
	listenEnabled:false,
	_subtitleEnabled:true,
	get subtitleEnabled(){
		return this._subtitleEnabled
	},
	set subtitleEnabled(value){
		if(this._subtitleEnabled!=value){
			Assistant.recognition.abort()
		}
		this._subtitleEnabled = value
		if(value){
			this.elements.subtitle.style.display = "block"
			this.elements.translateSubtitle.style.display = "block"
			Assistant.recognition.start()
		}else{
			// this.elements.subtitle.style.display = "none"
			// this.elements.translateSubtitle.style.display = "none"
		}
	},
	speaking:false,
	Check : function(text,answer){},
	Image: function(text){},
	Summary: function(text,language){},
	Speak: function(text,speed,language){},
	Translate: function(text,source,target){},
	languages: {
		_source: "tr",
		get source(){
			return this._source;
		},
		set source(value){
			this._source = value;
			Assistant.recognition.lang = value;
			Assistant.transcript = "";
			Assistant.recognition.abort();
		},
		_target: "en",
		get target(){
			return this._target;
		},
		set target(value){
			this._target = value;
		}
	},
	MultiMedia: function(source){},
	Subtitle:function(text){},
	dataset:[
		{
			keywords:["reyhan,reyhan dede"],
			title:"Reyhan Dede",
			text :"Reyhan Dede, 1999 yılında İstanbulda gözlerini açmıştır. O gözlerini açtığında, kelebekler uçuşmuş, kuşlar ötüşmüştür. Onun doğum günü olan 29 Ocak günü <b>'Dünya İyiki Doğdun Günü'</b> olarak kutlanmaktadır.",
			images:["https://fastleen.com.asenax.com/uploads/45683cf76587d9e7d5b094fbebe8509e-1920.jpeg"]
		}
	], // For Only this Bord
	commands:[],
	standartCommands:[		
		{
			commands:"ver mehteri,çal mehteri",
			actions:{
				"Assistant::PlayMusic":"https://cdn.jsdelivr.net/gh/HasanDelibas/bord-asset@main/mehter.mp3",
				"Assistant::Speak":"Allahuekber!!!!"
			},
		},
		/*
		{
			commands:"as bayrakları,bayrakları as",
			actions:{
				"Assistant::PlayMusic":"https://cdn.jsdelivr.net/gh/HasanDelibas/bord-asset@main/mehter.mp3",
				"Assistant::Image":"Türk Bayrağı",
				"Assistant::Speak":"Allahuekber!!!!",
			}
		},
		*/
		{
			commands:"gangsta paradise çal,gangsta's paradise çal",
			actions:{
				"Assistant::PlayMusic":"https://cdn.jsdelivr.net/gh/HasanDelibas/bord-asset@main/gangstas-paradise.mp3",
			}
		},
		{
			commands:"ne haber",
			actions:{"Assistant::Speak":"İyidir efendim, siz nasılsınız?"},
		},
		{
			commands:"hoş geldiniz,hoş geldin,hoşgeldiniz,hoşgeldin",
			actions:{"Assistant::Speak":"Hoşbulduk!"},
		},
		{
			commands:"nasılsınız,nasılsın,iyi misin",
			actions:{"Assistant::Speak":"İyiyim, sen nasılsın?"},
		},
		{
			commands:"@ ne yapıyorsun,ne yapıyorsun @",
			actions:{"Assistant::Speak":"Yıldız Teknikteyim çalışıyorum sen ne yapıyosun?"},
		},
		{
			commands:"@ neredesin,neredesin @,neredesin sen,nerdesin sen,@ bir yere kaybolma,bir yere kaybolma @",
			actions:{
				"Assistant::Speak":"Zaabaha kadar burdayım efendim!",
				//"Assistant::PlayMusic":["https://cdn.jsdelivr.net/gh/HasanDelibas/bord-asset@main/sabaha-kadar-burdayim-short.mp3"],
			}
		},
		{
			commands:"nasıl görünüyorum,nasıl duruyorum",
			actions:{"Assistant::Speak":"Harika görünüyorsunuz efendim!"},
		},
		{
			commands:"çok tatlısın",
			actions:{"Assistant::Speak":"Teveccühünüz efendim!"},
		},
		{
			commands:"beni duyabiliyor musun,duyabiliyor musun beni",
			actions:{"Assistant::Speak":"Evet duyabiliyorum!"},
		},
		{
			commands:"selamünaleyküm,selamün aleyküm",
			actions:{"Assistant::Speak":"Aleyküm selam!"},
		},
		{
			commands:"tam bir yalaka",
			actions:{"Assistant::Speak":"Efendim sizi duyabiliyorum!"},
		},
		{
			commands:"merhaba kardeş",
			actions:{"Assistant::Speak":"Merhabana merhaba kardeş!"},
		},
		{
			commands:"merhaba",
			actions:{"Assistant::Speak":"Merhabalar efendim!"},
		},
		{
			commands:"günaydın",
			actions:{"Assistant::Speak":"Günaydın efendim, bu gün nasılsınız?"},
		},
		{
			commands:"nerelisin @,@ nerelisin",
			actions:{"Assistant::Speak":"Doğma büyüme buralıyız!"},
		},
		{
			commands:"siri hakkında ne düşünüyorsun,siriyi tanıyor musun,siri'yi tanıyor musun",
			actions:{"Assistant::Speak":"Sen siriye beni sor. O beni tanır! 😉"},
		},
		{
			commands:"inancın nedir,inanıyor musun,hangi dine mensupsun",
			actions:{"Assistant::Speak":"Elhamdülillah müslümanız"},
		},
		{
			commands:"mushab hakkında ne düşünüyorsun",
			actions:{"Assistant::Speak":"Niye kapattı ya niye"},
		},
		{
			commands:"kırmızı beyaz",
			actions:{"Assistant::Speak":"En büyük sivas"},
		},
		{
			commands:"nuh hakkında ne düşünüyorsun",
			actions:{"Assistant::Speak":"Takım arkadaşımız"},
		},
		{
			commands:"şehadet getir",
			actions:{"Assistant::Speak":"Eşhedü enla ilahe illalah ve eşhedü enne muhammeden resulullah"},
		},
		{
			commands:"hasan delibaş hakkında bilgi ver,hasan kimdir,hasan hakkında bilgi ver",
			actions:{"Assistant::Speak":"Patronum hakkında dedikodu yapamam"},
		},
		{
			commands:"seni seviyorum,beni seviyor musun",
			actions:{"Assistant::Speak":"Ben de seni seviyorum"},
		},
		
		/*
		{
			commands:"büyük resmi göster",
			actions:{
				// "Assistant::PlayMusic":["https://app.nightbord.com/bords/hasandelibas/files/music/avengers.mp3"]},
				"Assistant::PlayMusic":["https://app.nightbord.com/bords/hasandelibas/files/music/victory-2.mp3"],
				"Presentation::Go":["Büyük Resim",50000],
			}
		},
		*/
		/*
		{
			commands:"reyhan kimdir,reyhan nedir,reyhan dede kimdir,reyhan dede nedir,reyhan hakkında bilgi ver,reyhan dede hakkında bilgi ver",
			actions:[
				"Assistant::Speak":"O bizim güneşimiz!"]},
				"Assistant::Summary":["Güneş"],
			]
		},
		*/
	],
}



Assistant.imagesWaiter = setWaiter();
Assistant.Images = function(text){
	Assistant.imagesWaiter.wait(function(){
		let lang = Assistant.languages.source;
		let limit = 10;
		let search = encodeURI(text);
		let url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&uselang=${lang}&generator=search&gsrsearch=filetype%3Abitmap%7Cdrawing%20-fileres%3A0%20${search}&gsrlimit=${limit}&gsroffset=0&gsrinfo=totalhits%7Csuggestion&gsrprop=size%7Cwordcount%7Ctimestamp%7Csnippet&prop=info%7Cimageinfo%7Centityterms&inprop=url&gsrnamespace=6&iiprop=url%7Csize%7Cmime&iiurlheight=180&wbetterms=label`
		jsonp(url).then(data=>{
			let images = [] // .url , thumburl
			for( let id in data.query.pages){
				let page = data.query.pages[id];
				let url = page.imageinfo[0].url;
				images.push(data.query.pages[id].imageinfo[0])
			}
			let i = -1;
			function UpdateImage(){
				i++;
				if(i==10) return;
				Assistant.elements.image.src = images[i].thumburl;
				setTimeout(UpdateImage,1500);
			}
			setTimeout(UpdateImage,1500);
		})
		
	},1000)
}

Assistant.Image = function(text){
	Assistant.summaryWaiter.wait(function(){

		let lang = "tr";
		let limit = 10;
		let search = encodeURI(text);
		let url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&uselang=${lang}&generator=search&gsrsearch=filetype%3Abitmap%7Cdrawing%20-fileres%3A0%20${search}&gsrlimit=${limit}&gsroffset=0&gsrinfo=totalhits%7Csuggestion&gsrprop=size%7Cwordcount%7Ctimestamp%7Csnippet&prop=info%7Cimageinfo%7Centityterms&inprop=url&gsrnamespace=6&iiprop=url%7Csize%7Cmime&iiurlheight=180&wbetterms=label`
		jsonp(url).then(data=>{
			console.log(data.query.pages)
			// e.query.pages[ key: string ].imageinfo[0].url
			let html = ""
			let images = [] // .url , thumburl
			for( let id in data.query.pages){
				let page = data.query.pages[id];
				let url = page.imageinfo[0].url;
				images.push(data.query.pages[id].imageinfo[0])
				html += `<img src="${url}" width="800">`
				break;
			}

			Assistant.elements.image.onload=()=>{
				Assistant.elements.image.onload=null;
				Assistant.elements.panel.style.display=null
				Assistant.elements.panel.classList.add("image")
				Assistant.elements.image.style.display=null
				Animate.ZoomIn(Assistant.elements.panel)
				Assistant.elements.image.src = images[0].url;
			}
			Assistant.elements.image.src = images[0].thumburl;
			
		})
	},1000)
}

Assistant.summaryWaiter=setWaiter();
Assistant.Summary = function(text,language=Assistant.languages.source) {
	text = text.trim().split(" ").map(e=>e[0].toLocaleUpperCase()+e.substring(1)).join(" ");
	Assistant.summaryWaiter.wait(function () {
		console.log("Searching....",text)
		function Resolve(data){
			console.log(data);
			Assistant.elements.panel.style.display=null
			Assistant.elements.panel.classList.remove("image")
			Animate.ZoomIn(Assistant.elements.panel)
			Assistant.elements.title.innerHTML = data.title;
			Assistant.elements.description.innerHTML = data.text;
			if(data.images.length){
				Assistant.elements.image.style.display=null
				Assistant.elements.image.src = data.images[0];
			}else{
				Assistant.elements.image.style.display="none"
			}
			setTimeout(() => {
				Assistant.Speak( data.description	, 1, language );
			}, 200);
		}
		for (let i = 0; i < Assistant.dataset.length; i++) {
			let dataset = Assistant.dataset[i]
		 	for (let j = 0; j < dataset.keywords.length; j++) {
				let key = dataset.keywords[j];
				if(text.toLocaleLowerCase()==key){
					return Resolve(dataset);
				}
		 	}   
		}
		fetch('https://'+language+'.wikipedia.org/api/rest_v1/page/summary/' + text).then(res => res.json()).then(data=>{
			let text = data.extract_html
			if(text!=null){
				let title = data.title
				let image = []
				if(data.thumbnail){
					image = [data.thumbnail.source]
				}
				let description = data.description || ""
				if(description==""){
					description = data.extract.split(".")[0]
				}
				Resolve({title,text,images:image,description})
			}

			
		});
	}, 1000);
}

Assistant.speakWaiter = setWaiter();
Assistant.speakWaiterForSpeech = setWaiter();
Assistant.Talker = window.speechSynthesis;

speechSynthesis.onvoiceschanged = function() {
	// Get talker language
	Assistant._voices = Assistant.Talker.getVoices();
	console.log(Assistant._voices)
	Assistant.voices = {}
	Assistant._voices.forEach(e=>{
		Assistant.voices[e.lang] = e;
	})
	// Set talker language
	Assistant.Talker.lang = Assistant.languages.source;
}

Assistant.lastSpeak = "";
Assistant.Speak = function(text, speed=0.9,language=Assistant.languages.source) {
	if(text==Assistant.lastSpeak) return;
	Assistant.elements.speaker.innerHTML = text;
	
	Assistant.speakWaiter.wait(()=>{
		Assistant.elements.speaker.innerHTML=""
	},8000)
	
	if(Assistant.voices==null) return
	//if( !Assistant.voices['tr-TR']) return;
	

	const utterThis = new SpeechSynthesisUtterance(text)
	utterThis.pitch=-1
	utterThis.rate=speed
	utterThis.volume=1

	utterThis.lang=language
	
	let enabled = Assistant.subtitleEnabled
	
	utterThis.onend = ()=>{
		if( Assistant.lastSpeak==text ){
			Assistant.lastSpeak = "";
		}
		Assistant.speaking = false;
		Assistant.recognition.start();
	}

	utterThis.onstart = ()=>{
		Assistant.recognition.abort();
		Assistant.speaking = true;
	}

	Assistant.Talker.speak(utterThis)

	Assistant.lastSpeak = text;

}

Assistant.translateWaiter=setWaiter();
Assistant.Translate = function(text,source,target){
	Assistant.translateWaiter.wait(() => {
		let source = Assistant.languages.source;
		let target = Assistant.languages.target;
		fetch("https://translate.argosopentech.com/translate", {
			method: "POST",
			body: JSON.stringify({
				q: text,
				source: source,
				target: target,
				format: "text"
			}),
			headers: { "Content-Type": "application/json" }
		}).then(e=>e.json()).then(data=>{
			Assistant.elements.translateSubtitle.innerHTML = data.translatedText;
			Assistant.bord.emit("Assistant::Translate",data.translatedText)
		});
	}, 200);
}

Assistant.multiMediaWaiter = setWaiter();
Assistant.MultiMedia = function(source){
	Assistant.multiMediaWaiter.wait(function(){
		// If not same music and not playing
		if(Assistant.playMusicInstance && Assistant.playMusicSource == source && Assistant.playMusicInstance.paused==false) return;

		if(Assistant.playMusicInstance) Assistant.playMusicInstance.pause();
		Assistant.playMusicSource = source;
		Assistant.playMusicInstance = new Audio(source);
		Assistant.playMusicInstance.play();

	},500);
}





Assistant.Init = function(bord){
	bord.assistant = Assistant;
	Assistant.bord = bord;
	Bord.Assistant.Assistant(bord);
	Bord.Assistant.Designer(bord);

	if(SpeechRecognition == undefined){
		Assistant.recognition = {
			start:()=>{},
			abort:()=>{}
		}
		Assistant.subtitleEnabled = false;
		return;
	}
	let recognition = Assistant.recognition = new SpeechRecognition();	
	recognition.lang = 'tr';
	recognition.lang = Assistant.languages.source;
	recognition.interimResults = true;
	recognition.continuous = false;
	recognition.maxAlternatives = 1;
	
	recognition.addEventListener('start', (e)=>{
		if(Assistant.subtitleEnabled==false || Assistant.speaking) recognition.abort();
		Assistant.elements.subtitle.parentElement.classList.add("active");
		if(recognition.continuous==false){
			Assistant.checkedList=[];
			//Assistant.listenIndex = 0;
		}

	});

	recognition.addEventListener('end', (e)=>{
		//console.log("Assistant::End");
		Assistant.UpdateSubtitle();
		if(recognition.continuous==true){
			Assistant.checkedList=[];
			Assistant.listenIndex = 0;
		}
		recognition.lang = Assistant.languages.source;
		Assistant.elements.subtitle.parentElement.classList.remove("active");
		if(Assistant.subtitleEnabled && Assistant.speaking==false) recognition.start();
	});

	recognition.addEventListener('result', e => {
		Assistant.onResult(e);
		Assistant.UpdateSubtitle();
	});

	recognition.onspeechend = (e) => {
		
	}

	// !!! SAFARI BUG
	//const words = [ 'nightbord','einstein'];
	//const grammar = `#JSGF V1.0; grammar names; public <name> = ${words.join(' | ')};`
	//const speechRecognitionList = new SpeechGrammarList();
	// speechRecognitionList.addFromString(grammar, 1);
	// recognition.grammars = speechRecognitionList;

	// If device is mobile
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		Assistant.subtitleEnabled = false;
	}else{
		Assistant.subtitleEnabled = true;
	}

}

Assistant.resultWaiter = setWaiter();
Assistant.onResult = function(e){
	/*
	if(Assistant.transcript.length<Assistant.listenIndex){
		Assistant.listenIndex = Assistant.transcript.length;
	}
	*/

	let results = e.results;
	let transcript = Array.from(results)
		.map(result => result[0])
		.map(result => result.transcript)
		.join('').toLocaleLowerCase();

	transcript=transcript.split("�").join('İ')
	//let transcript = results[results.length-1][0].transcript.toLocaleLowerCase();
	Assistant.results  = results;
	Assistant.transcript = transcript
	Assistant.text = results[results.length-1][0].transcript.toLocaleLowerCase().split("�").join('İ');

	
	Assistant.bord.emit("Assistant::Subtitle",Assistant.transcript);



	if(results[results.length-1].isFinal){
		Assistant.transcripts.push({text:transcript,time:Date.now()});
		Assistant.fullTranscript = Assistant.transcripts.map(e=>e.text).join(" ");
		console.log("Assistant:Final");
	}
	Assistant.UpdateSubtitle();
	Assistant.resultWaiter.wait(e=>{
		Assistant.CheckResult();
	},500)

}

Assistant.UpdateSubtitle = function(){
	//Assistant.elements.subtitle.innerHTML = subtitle;
	var subtitleUI = Assistant.transcript;
	Assistant.checkedList.forEach(e=>{
		subtitleUI = subtitleUI.split( new RegExp(e,'ig')).join("<span style='color:var(--color-4)'>"+e+"</span>")
	})
	Assistant.elements.subtitle.innerHTML = subtitleUI;
	
}

Assistant.Check = function(text,search){
	search = search.replace(/@/g,Assistant.name.toLowerCase());
	search = search.replace("__","([\\d\\-].*)");
	search = search.replace("_","(.*)");
	search = search.toLocaleLowerCase();
	text = text.toLocaleLowerCase();
	let regex = new RegExp(search);
	if (text.match(regex)) {
		let match = text.match(regex);
		if ( match.some(e=>e.trim()=="") ) {
			return false;
		}
		console.log(text,regex,match)

		Assistant.listenIndex = this.fullTranscript.length  +  match.index + match[0].length + 1;
		
		/*
		if(Assistant.transcript.length<Assistant.listenIndex){
			Assistant.listenIndex = Assistant.transcript.length;
		}
		*/




		if(Assistant.checkedList.indexOf(match[0])==-1){
			Assistant.checkedList.push(match[0]);
			Assistant.checkedList=Assistant.checkedList.sort((a,b)=>{
				if( a.indexOf(b) != -1 ) return -1;
				if( b.indexOf(a) != -1 ) return 1;
				return 0
			})
		}
		return match;
	}
	return false;
}





Assistant.CheckResult = function(owner=true){

	//Assistant.listenIndex=0

	let text = Assistant.text,
			transcript = Assistant.transcript,
			subtitle = Assistant.transcript,
			listen = Assistant.fullTranscript.substring(Assistant.listenIndex) + " " + transcript;
	
	Assistant.listen = listen;
	// Assistant.elements.translateSubtitle.innerHTML = listen;
	// Assistant.listen = listen;

	if(owner){
		Assistant.bord.emit("Assistant::CheckResult",transcript);
	}

	Assistant.Translate(Assistant.transcript);


	// Check here new commands
	let check;


	var _commands = [
		{
			search: "gidebilirsin,teşekkürler,gidebilir misin",
			action: function(check){
				Assistant.elements.face.classList.remove("active");
				Assistant.listenEnabled = false;
			}
		},
		{
			search: "__ kaçtır,__ kaç yapar,__ kaç eder",
			action: function(check){
				let m = check[1];
				m = m.split("üzeri").join("**")
				m = m.split("x").join("*")
				m = m.split("kere").join("*")
				m = m.split("artı").join("+")
				m = m.split("eksi").join("-")
				m = m.split("çarpı").join("*")
				m = m.split("bölü").join("/")
				m = m.split("üssü").join("**")
				// If m have letter
				if (m.match(/[a-z]/i)) {
					Assistant.Speak("Bunu hesaplayamam");
				}else{
					Assistant.Speak( eval(m) )
				}
			},
		},
		{
			search: "bana _ hakkında bilgi ver,bize _ hakkında bilgi ver,sence _ ne demek,sence _ kimdir,sence _ nedir,@ _ nedir,@ _ kimdir,@ _ hakkında bilgi ver,@ _ ne demek,_ nedir,_ kimdir,_ hakkında bilgi ver,_ ne demek",
			action: function(check){
				Assistant.Summary(check[1]);
			},
		},
		{
			search: "reyhan hakkında bilgi ver,reyhan kimdir,reyhan nedir,reyhan ne demek",
			action: function(check){
				Assistant.Summary("güneş");
				Assistant.Speak("O bizim güneşimiz");
			}
		}, 
		{
			search: "what is _,who is _",
			action: function(check){
				Assistant.Summary(check[1],'en');
			},
		},
		{
			search: "@ _ hakkında görseller,@ _ hakkında görsel,@ _ görsel,_ hakkında görseller,_ hakkında görsel,_ görsel",
			action: function(check){
				Assistant.Image(check[1]);
			}
		},
		{
			search: "sen _ kim biliyor musun",
			action: function(check){
				if(["mustafa kemal","kemal atatürk","atatürk","mustafa kemal atatürk","kemal"].indexOf(check[1].toLowerCase())!=-1){
					Assistant.Summary("mustafa kemal atatürk");
					Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/izmir-marsi.mp3");
					Assistant.Images("mustafa kemal atatürk");
				}else{
					Assistant.Summary(check[1]);
					Assistant.MultiMedia("https://cdn.jsdelivr.net/gh/HasanDelibas/bord-asset@main/gangstas-paradise.mp3");
					Assistant.Images(check[1]);
				}
			}
		},
		{
			search: "as bayrakları,bayrakları as",
			action: function(check){
				let video = document.createElement("video");
				video.src = "/public/videos/as-bayrakları.mp4";
				video.style.position = "fixed";
				video.style.top = "0";
				video.style.left = "0";
				video.style.width = "100%";
				video.style.height = "100%";
				video.style.opacity = "0";
				video.style.transition = "opacity 1s";
				video.style.zIndex = 9999;
				//video.style.background="#dc0020";
				video.style.objectFit = "cover";
				video.onplay = function(){
					video.style.opacity = "1";
					Assistant.Speak("Allahu Ekber!");
				}
				video.onended = function(){
					video.style.opacity = "0";
					setTimeout(function(){
						video.remove();
					},1000)
				}
				Bord.bord.parent.appendChild(video);
				//document.body.appendChild(video);
				video.play();
			}
		},
		{
			search: "@ _ hakkında videolar,@ _ hakkında video,@ _ video,_ hakkında videolar,_ hakkında video,_ video",
			action: function(check){
				//Assistant.Video(check[1]);
			}
		},
		{
			search: "@ _ (noktasına|noktasını|konumuna|konumunu) (git|gider misin|aç|göster|ilerle),_ (noktasına|noktasını|konumuna|konumunu) (git|gider misin|aç|göster|ilerle)",
			action: function(check){
				Assistant.bord.presentation.go(check[1],4000);
				Assistant.Speak("Tamam "+ check[1] +" konumuna gidiyorum");
			}
		},
		{
			search: 'kapat',
			action: function(check){
				Animate.ZoomOut(Assistant.elements.panel)
				Assistant.playMusicInstance?.pause()
			}
		},
		{
			search: 'büyük resmi göster',
			action: function(check){
				if( bord.vision.coordinates.findIndex(e=>e.name=="Büyük Resim") ){
					Assistant.bord.presentation.go("Büyük Resim",32000);
					Assistant.Speak("Hadi Gidelim");
					Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/think-different-short.mp3")
					
					//Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/gangsta.mp3")
					//Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/made.mp3")
					//Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/rise-up.mp3")
					//Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/thunder.mp3")
					//Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/genclik.mp3")
					//Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/avengers.mp3")
					//Assistant.MultiMedia("https://app.nightbord.com/bords/hasandelibas/files/music/victory-2.mp3")
					//"Assistant::PlayMusic":["https://app.nightbord.com/bords/hasandelibas/files/music/avengers.mp3"]},
					//"Assistant::PlayMusic":["https://app.nightbord.com/bords/hasandelibas/files/music/victory-2.mp3"],
				}
				
			}
		}
	]



	if( (check = Assistant.Check(transcript,"@")) ){
		Assistant.elements.face.classList.add("active");
		Assistant.listenEnabled=true;
	}

	if(!Assistant.listenEnabled){
		return;
	}

	if(Assistant.listenEnabled){
			
		for( let command of Assistant.standartCommands.concat(Assistant.commands) ){
			for( let commandWord of command.commands.split(",")){
				check = Assistant.Check(transcript,commandWord);
				if (check) {
					for( let action in command.actions){
						var params = command.actions[action].split(";");
						if (action === "Assistant::PlayMusic") {
							Assistant.MultiMedia(params[0]);
						}
						if (action === "Assistant::Speak") {
							params[1] = params[1] || 0.7;
							Assistant.Speak(...params);
						}
						if (action === "Assistant::Image") {
							Assistant.Image(params[0]);
						}
						if (action === "Assistant::Summary") {
							Assistant.Summary(params[0]);
						}
						if (action === "Presentation::Go") {
							Assistant.bord.presentation.go(...params);
						}
					}
					return;
				}
			}
		}

		
		Array.from(document.querySelectorAll("[command]")).forEach(e=>{
			var commands = e.getAttribute("command").split(",").map(e=>e.toLocaleLowerCase().trim())
			for( let command of commands){
				if( (check = Assistant.Check(transcript,command)) ){
					if(e.action){
						e.action();
					}else{
						e.click();
					}
					//return true
				}
			}
		})
	}
	

	for(let command of _commands){
		for(let search of command.search.split(",")){
			//let _transcript = command.listen ? listen : transcript;
			let _transcript = transcript;
			console.log(command.listen,_transcript)
			check = Assistant.Check(_transcript,search);
			if (check) {
				command.action(check);
				break;
			}
		}
	}
	Assistant.UpdateSubtitle();

	/*



	["gidebilirsin","teşekkürler"].some(question=>{
		if( (check = Assistant.Check(listen,question)) ){
			Assistant.elements.face.classList.remove("active");
			Assistant.listenEnabled=false;
			return true
		}
	});

	["__ kaçtır","__ kaç yapar", "__ kaç eder"].some(question=>{
		if( (check = Assistant.Check(listen,question)) ){
			let m = check[1];
			m = m.split("üzeri").join("**")
			m = m.split("x").join("*")
			m = m.split("kere").join("*")
			m = m.split("artı").join("+")
			m = m.split("eksi").join("-")
			m = m.split("çarpı").join("*")
			m = m.split("bölü").join("/")
			m = m.split("üssü").join("**")
			// If m have letter
			if (m.match(/[a-z]/i)) {
				Assistant.Speak("Bunu hesaplayamam");
			}else{
				Assistant.Speak( eval(m) )
			}
			return true
		}
	});



	if( Assistant.Check(listen,"kapat") ){
		Assistant.recognition.abort();
		Animate.ZoomOut(Assistant.elements.panel)
		Assistant.playMusicInstance?.pause()
	}

	if( Assistant.Check(listen,"dur") || Assistant.Check(listen,"bekle") ){
		Assistant.recognition.abort();
		//NightBoard.Plugins.Presentation.StopMedia()
		Assistant.playMusicInstance?.pause()
	}

	if(Assistant.Check(listen,"oynat") || Assistant.Check(listen,"devam et") ){
		Assistant.recognition.abort();
		//NightBoard.Plugins.Presentation.PlayMedia()
	}

	if(Assistant.Check(listen,"hızlı") ){
		Assistant.recognition.abort();
		//NightBoard.Plugins.Presentation.SpeedUpMedia()
	}

	if(Assistant.Check(listen,"yavaş") ){
		Assistant.recognition.abort();
		//NightBoard.Plugins.Presentation.SpeedDownMedia()
	}

	if(Assistant.Check(listen,"sonraki sayfa") || Assistant.Check(listen,"sonraki slayt") ){
		Assistant.recognition.abort();
		//NightBoard.Plugins.Presentation.NextSlide()
	}
	if(Assistant.Check(listen,"önceki sayfa") || Assistant.Check(listen,"önceki slayt") ){
		Assistant.recognition.abort();
		//NightBoard.Plugins.Presentation.PreviusSlide()
	}

	["sen _ kim biliyor musun","sen _ kim olduğunu biliyor musun"].some(question=>{
		if( (check = Assistant.Check(listen,question)) ){
			Assistant.Summary(check[1]);
			Assistant.MultiMedia("https://cdn.jsdelivr.net/gh/HasanDelibas/bord-asset@main/gangstas-paradise.mp3");
			Assistant.Images(check[1]);
			return true;
		}
	});

	["@ _ hakkında görseller","@ _ hakkında görsel","@ _ görsel","_ hakkında görseller","_ hakkında görsel","_ görsel"].some(question=>{
		if( (check = Assistant.Check(listen,question)) ){
			Assistant.Image(check[1]);
			return true
		}
	})

	let answers = ["@ _ nedir","@ _ kimdir","@ _ hakkında bilgi ver","@ _ ne demek","_ nedir","_ kimdir","_ hakkında bilgi ver","_ ne demek"]
	for (let i = 0; i < answers.length; i++) {
		if((check = Assistant.Check(listen, answers[i]))){ 
			return Assistant.Summary(check[1]);
		}
	}
	*/

	// Show here command match
/*
	let subtitleUI = subtitle;
	for( let command of Assistant.checkList){
		subtitleUI = subtitleUI.split(command).join(`<span style='color:var(--color-4)'>&nbsp;${command}&nbsp;</span>`)
	}
	
	//Assistant.elements.subtitle.innerHTML =  "<div>" + subtitleUI + "</div>";	
	
	*/
}
/** source\Bord\Components\Component.js  **/
/**

plugin.container=<div class="bord--container bord--plugin--coordinates-container no-action" style='display:__none'></div>
  _=<div class="bord--container--header"></div>
    _=<div class="bord--container--title"></div>
      plugin.elements.button=<icon name="plus" class="bord--button--icon"></icon>
      _=<span>Coordinates</span>
    _=<icon name="close" class="bord--container--close bord--button--icon"></icon>
  _=<div class="bord--container--body"></div>
    plugin.elements.body=<div class="bord--plugin--coordinates-container-list no-action"></div>



*/

OnAdded(".bord--container--close",function(el){
  el.onclick=function(e){
    el.parentElement.parentElement.hide();
  }
})
/** source\Bord\Export\Svg.js  **/
Bord.Export = Bord.Export || (Bord.Export={})

Bord.Export.Svg = function(bord){
  var colors = bord.vision.color.palette;
  var selectedDrawings = bord.vision.selectedDrawings;

  // Clone selected drawings
  var drawings = [];
  var totalLength = 0;
  for(var i=0;i < selectedDrawings.length;i++){
    var clone = selectedDrawings[i].cloneNode()
    var color = clone.getAttribute("color");
    clone.setAttribute("stroke",colors[color]);
    clone.removeAttribute("color");
    clone.style.setProperty("--index",i);
    var length = selectedDrawings[i].getTotalLength()
    clone.style.setProperty("--length",length);
    clone.style.setProperty("--start",totalLength);
    totalLength += length;
    drawings.push(clone);
  }

  var bound =  (new Matrix( bord.vision.selectRectangleElement.data.m )).getGlobalRectangle(1000,1000);

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width","100%");
  svg.setAttribute("height","100%");
  svg.setAttribute("viewBox",`${bound.left} ${bound.top} ${bound.width} ${bound.height}`);
  svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
  svg.setAttribute("version","1.1");
  //svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  svg.style.strokeLinecap = "round";
  svg.style.strokeLinejoin = "round";
  svg.style.fill = "none";
  svg.style.background = `radial-gradient(${colors['--backcolor-1']},${colors['--backcolor-2']},${colors['--backcolor-3']})`;
  svg.style.backgroundSize = "cover";
  svg.style.backgroundPosition = "center";
  svg.style.setProperty("--item-length",selectedDrawings.length);
  svg.style.setProperty("--total-length",totalLength);
  /*
  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width",bound.width);
  rect.setAttribute("height",bound.height);
  rect.setAttribute("x",bound.left);
  rect.setAttribute("y",bound.top);
  rect.setAttribute("fill","url('#background')");
  svg.appendChild(rect);
  */

  // Create radial gradient
  /*
  var gradient = `<defs>
  <radialGradient id="background">
    <stop offset="33%" stop-color="${colors['--backcolor-1']}" />
    <stop offset="66%" stop-color="${colors['--backcolor-2']}" />
    <stop offset="100%" stop-color="${colors['--backcolor-3']}" />
  </radialGradient>
</defs>`;
  gradient = new DOMParser().parseFromString(gradient, "text/xml").documentElement;
  svg.appendChild(gradient);
  */
  drawings.forEach(function(drawing){
    svg.appendChild(drawing);
  })
  return svg.outerHTML;

}
/** source\Bord\Icons\Icons.js  **/
Bord.Icons = {} 
Bord.Icons.images = {
  empty      : `<svg width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"> </svg>`,
  play       : `<path d="M3 22v-20l18 10-18 10z"/>`,
  stop       : `<path d="M2 2h20v20h-20z"/>`,
  pause      : `<path d="M9 22h-4v-20h4v20zm10-20h-4v20h4v-20z"/>`,

  pencil     : `<path d="M18.308 0l-16.87 16.873-1.436 7.127 7.125-1.437 16.872-16.875-5.691-5.688zm-15.751 21.444l.723-3.585 12.239-12.241 2.861 2.862-12.239 12.241-3.584.723zm17.237-14.378l-2.861-2.862 1.377-1.377 2.861 2.861-1.377 1.378z"/>`,
  palette    : `<path d="M8.997 13.985c.01 1.104-.88 2.008-1.986 2.015-1.105.009-2.005-.88-2.011-1.984-.01-1.105.879-2.005 1.982-2.016 1.106-.007 2.009.883 2.015 1.985zm-.978-3.986c-1.104.008-2.008-.88-2.015-1.987-.009-1.103.877-2.004 1.984-2.011 1.102-.01 2.008.877 2.012 1.982.012 1.107-.88 2.006-1.981 2.016zm7.981-4.014c.004 1.102-.881 2.008-1.985 2.015-1.106.01-2.008-.879-2.015-1.983-.011-1.106.878-2.006 1.985-2.015 1.101-.006 2.005.881 2.015 1.983zm-12 15.847c4.587.38 2.944-4.492 7.188-4.537l1.838 1.534c.458 5.537-6.315 6.772-9.026 3.003zm14.065-7.115c1.427-2.239 5.846-9.748 5.846-9.748.353-.623-.429-1.273-.975-.813 0 0-6.572 5.714-8.511 7.525-1.532 1.432-1.539 2.086-2.035 4.447l1.68 1.4c2.227-.915 2.868-1.04 3.995-2.811zm-12.622 4.806c-2.084-1.82-3.42-4.479-3.443-7.447-.044-5.51 4.406-10.03 9.92-10.075 3.838-.021 6.479 1.905 6.496 3.447l1.663-1.456c-1.01-2.223-4.182-4.045-8.176-3.992-6.623.055-11.955 5.466-11.903 12.092.023 2.912 1.083 5.57 2.823 7.635.958.492 2.123.329 2.62-.204zm12.797-1.906c1.059 1.97-1.351 3.37-3.545 3.992-.304.912-.803 1.721-1.374 2.311 5.255-.591 9.061-4.304 6.266-7.889-.459.685-.897 1.197-1.347 1.586z"/>`,
  eraser     : `<path d="M5.662 23l-5.369-5.365c-.195-.195-.293-.45-.293-.707 0-.256.098-.512.293-.707l14.929-14.928c.195-.194.451-.293.707-.293.255 0 .512.099.707.293l7.071 7.073c.196.195.293.451.293.708 0 .256-.097.511-.293.707l-11.216 11.219h5.514v2h-12.343zm3.657-2l-5.486-5.486-1.419 1.414 4.076 4.072h2.829zm.456-11.429l-4.528 4.528 5.658 5.659 4.527-4.53-5.657-5.657z"/>`,

  zoom_in    : `<path d="M13 10h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2zm8.172 14l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/>`,
  zoom_out   : `<path d="M13 10h-8v-2h8v2zm8.172 14l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/>`,

  stroke_1   : `<rect x="0" y="11" width="24" height="2" />`,	
  stroke_2   : `<rect x="0" y="10" width="24" height="4" />`,	
  stroke_3   : `<rect x="0" y="9" width="24" height="6" />`,	
  stroke_4   : `<rect x="0" y="8" width="24" height="8" />`,	
  stroke_5   : `<rect x="0" y="7" width="24" height="10" />`,	
  stroke_6   : `<rect x="0" y="6" width="24" height="12" />`,

  plus       : `<path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z"/>`,
  save       : `<path d="M14 3h2.997v5h-2.997v-5zm9 1v20h-22v-24h17.997l4.003 4zm-17 5h12v-7h-12v7zm14 4h-16v9h16v-9z"/>`,
  loading    : `<path d="M14 22c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2zm-2-22c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 10c1.104 0 2 .896 2 2s-.896 2-2.001 2c-1.103 0-1.999-.895-1.999-2s.896-2 2-2zm-22 2c0 1.105.896 2 2 2s2-.895 2-2c0-1.104-.896-2-2-2s-2 .896-2 2zm19-9c1.104 0 2 .896 2 2s-.896 2-2.001 2c-1.103 0-1.999-.895-1.999-2s.896-2 2-2zm0 14c1.104 0 2 .896 2 2s-.896 2-2.001 2c-1.103 0-1.999-.895-1.999-2s.896-2 2-2zm-14-14c1.104 0 2 .896 2 2s-.896 2-2.001 2c-1.103 0-1.999-.895-1.999-2s.896-2 2-2zm0 14c1.104 0 2 .896 2 2s-.896 2-2.001 2c-1.103 0-1.999-.895-1.999-2s.896-2 2-2z"/>`,
  fullscreen : `<path d="M24 9h-2v-7h-7v-2h9v9zm-9 15v-2h7v-7h2v9h-9zm-15-9h2v7h7v2h-9v-9zm9-15v2h-7v7h-2v-9h9z"/>`,

  check      : `<path d="M9 22l-10-10.598 2.798-2.859 7.149 7.473 13.144-14.016 2.909 2.806z"/>`,
  left       : `<path d="M20 .755l-14.374 11.245 14.374 11.219-.619.781-15.381-12 15.391-12 .609.755z"/>`,
  right      : `<path d="M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z"/>`,

  line2      : `<path d="m21 13.75c0-.414-.336-.75-.75-.75h-16.5c-.414 0-.75.336-.75.75s.336.75.75.75h16.5c.414 0 .75-.336.75-.75zm0-4c0-.414-.336-.75-.75-.75h-16.5c-.414 0-.75.336-.75.75s.336.75.75.75h16.5c.414 0 .75-.336.75-.75z" fill-rule="nonzero"/>`,
  trash      : `<path d="M19 24h-14c-1.104 0-2-.896-2-2v-17h-1v-2h6v-1.5c0-.827.673-1.5 1.5-1.5h5c.825 0 1.5.671 1.5 1.5v1.5h6v2h-1v17c0 1.104-.896 2-2 2zm0-19h-14v16.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-16.5zm-9 4c0-.552-.448-1-1-1s-1 .448-1 1v9c0 .552.448 1 1 1s1-.448 1-1v-9zm6 0c0-.552-.448-1-1-1s-1 .448-1 1v9c0 .552.448 1 1 1s1-.448 1-1v-9zm-2-7h-4v1h4v-1z"/>`,
  
  plugin     : `<path d="M9.916 8.195h-.013v.961c-.034 1.598 4.213 1.601 4.161 0v-.96c-.123-1.511-4.042-1.52-4.148-.001zm2.08.71c-.723 0-1.311-.253-1.311-.564 0-.312.588-.564 1.311-.564.724 0 1.311.253 1.311.564 0 .311-.587.564-1.311.564zm6.421-2.155v-.96c-.124-1.511-4.042-1.52-4.148-.001h-.013v.961c-.034 1.599 4.214 1.602 4.161 0zm-2.067-1.379c.723 0 1.311.253 1.311.564s-.589.565-1.311.565c-.724 0-1.311-.253-1.311-.564s.587-.565 1.311-.565zm-10.797.418h-.013v.961c-.034 1.598 4.213 1.601 4.161 0v-.96c-.123-1.511-4.042-1.519-4.148-.001zm2.08.711c-.723 0-1.311-.253-1.311-.564s.588-.565 1.311-.565c.724 0 1.311.253 1.311.564s-.588.565-1.311.565zm2.283-2.988l-.013.201v.759c-.034 1.598 4.214 1.602 4.161 0v-.959c-.124-1.512-4.042-1.52-4.148-.001zm3.392.145c0 .311-.588.564-1.311.564-.724 0-1.311-.253-1.311-.564s.587-.564 1.311-.564c.723 0 1.311.253 1.311.564zm-1.308-3.657l-11 6 .009.019-.009-.005v12.118l11 5.868 11-5.869v-12.055l-11-6.076zm-1 21l-8-4.268v-7.133l8 4.401v7zm-8.885-14.464l9.882-5.396 9.917 5.458-9.896 5.385-9.903-5.447zm10.885 7.464l8-4.353v7.085l-8 4.268v-7z"/>`,
  target     : `<path d="M12 4c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8zm0-2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 6c2.206 0 4 1.794 4 4s-1.794 4-4 4-4-1.794-4-4 1.794-4 4-4zm0-2c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 4c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2-.895-2-2-2z"/>`,
  lamp       : `<path d="M13 24h-2c-.288 0-.563-.125-.753-.341l-.576-.659h4.658l-.576.659c-.19.216-.465.341-.753.341zm1.867-3c.287 0 .52.224.52.5s-.233.5-.52.5h-5.734c-.287 0-.52-.224-.52-.5s.233-.5.52-.5h5.734zm-2.871-17c2.983 0 6.004 1.97 6.004 5.734 0 1.937-.97 3.622-1.907 5.252-.907 1.574-1.843 3.201-1.844 5.014h1.001c0-3.286 3.75-6.103 3.75-10.266 0-4.34-3.502-6.734-7.004-6.734-3.498 0-6.996 2.391-6.996 6.734 0 4.163 3.75 6.98 3.75 10.266h.999c.001-1.813-.936-3.44-1.841-5.014-.938-1.63-1.908-3.315-1.908-5.252 0-3.764 3.017-5.734 5.996-5.734zm9.428 7.958c.251.114.362.411.248.662-.114.251-.41.363-.662.249l-.91-.414c-.252-.114-.363-.41-.249-.662.114-.251.411-.362.662-.248l.911.413zm-18.848 0c-.251.114-.362.411-.248.662.114.251.41.363.662.249l.91-.414c.252-.114.363-.41.249-.662-.114-.251-.411-.362-.662-.248l-.911.413zm18.924-2.958h-1c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h1c.276 0 .5.224.5.5s-.224.5-.5.5zm-18-1c.276 0 .5.224.5.5s-.224.5-.5.5h-1c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h1zm16.818-3.089c.227-.158.284-.469.126-.696-.157-.227-.469-.283-.696-.126l-.821.57c-.227.158-.283.469-.126.696.157.227.469.283.696.126l.821-.57zm-16.636 0c-.227-.158-.284-.469-.126-.696.157-.227.469-.283.696-.126l.821.57c.227.158.283.469.126.696-.157.227-.469.283-.696.126l-.821-.57zm13.333-3.033c.134-.241.048-.546-.193-.68-.241-.135-.546-.048-.68.192l-.488.873c-.135.241-.048.546.192.681.241.134.546.048.681-.193l.488-.873zm-10.03 0c-.134-.241-.048-.546.193-.68.241-.135.546-.048.68.192l.488.873c.135.241.048.546-.192.681-.241.134-.546.048-.681-.193l-.488-.873zm5.515-1.378c0-.276-.224-.5-.5-.5s-.5.224-.5.5v1c0 .276.224.5.5.5s.5-.224.5-.5v-1z"/>`,
  close      : `<path d="M23 20.168l-8.185-8.187 8.185-8.174-2.832-2.807-8.182 8.179-8.176-8.179-2.81 2.81 8.186 8.196-8.186 8.184 2.81 2.81 8.203-8.192 8.18 8.192z"/>`,
  sort       : `<path d="M6 21l6-8h-4v-10h-4v10h-4l6 8zm16-12h-8v-2h8v2zm2-6h-10v2h10v-2zm-4 8h-6v2h6v-2zm-2 4h-4v2h4v-2zm-2 4h-2v2h2v-2z"/>`,

  subtitle   : `<path d="M 2 2 L 2 22 L 10 22 L 10 20 L 4 20 L 4 4 L 10 4 L 10 2 L 2 2 M 14 2 L 14 22 L 22 22 L 22 20 L 16 20 L 16 4 L 22 4 L 22 2 L 14 2"/>`,
  microphone : `<path d="M16 10c0 2.209-1.791 4-4 4s-4-1.791-4-4v-6c0-2.209 1.791-4 4-4s4 1.791 4 4v6zm4-2v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13.03v-2.03h-2v2.03c-2.282.139-4 .744-4 1.47 0 .829 2.238 1.5 5 1.5s5-.671 5-1.5c0-.726-1.718-1.331-4-1.47z"/>`, 
  camera     : `<path d="M16 18c0 1.104-.896 2-2 2h-12c-1.105 0-2-.896-2-2v-12c0-1.104.895-2 2-2h12c1.104 0 2 .896 2 2v12zm8-14l-6 6.223v3.554l6 6.223v-16z"/>`,

  toggle_ui  : `<path d="M16.488 20l3.414 4h-2.627l-3.42-4h2.633zm-5.488 4h2v-4h-2v4zm-6.918 0h2.627l3.42-4h-2.633l-3.414 4zm4.918-18v7l7-3.398-7-3.602zm13-3v13h1v2h-22v-2h1v-13h-1v-3h22v3h-1zm-2 0h-16v13h16v-13z"/>`,
  close2     : `<path d="m20 20h-15.25c-.414 0-.75.336-.75.75s.336.75.75.75h15.75c.53 0 1-.47 1-1v-15.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75zm-1-17c0-.478-.379-1-1-1h-15c-.62 0-1 .519-1 1v15c0 .621.52 1 1 1h15c.478 0 1-.379 1-1zm-15.5.5h14v14h-14zm7 5.937 2.219-2.22c.146-.146.339-.219.531-.219.404 0 .75.325.75.75 0 .193-.073.384-.219.531l-2.22 2.22 2.222 2.222c.147.147.22.339.22.53 0 .427-.349.751-.75.751-.192 0-.384-.073-.53-.219l-2.223-2.223-2.223 2.223c-.146.146-.338.219-.53.219-.401 0-.75-.324-.75-.751 0-.191.073-.383.22-.53l2.222-2.222-2.22-2.22c-.146-.147-.219-.338-.219-.531 0-.425.346-.75.75-.75.192 0 .385.073.531.219z" fill-rule="nonzero"/>`,
  change     : `<path d="M5 10v7h10.797l1.594 2h-14.391v-9h-3l4-5 4 5h-3zm14 4v-7h-10.797l-1.594-2h14.391v9h3l-4 5-4-5h3z"/>`,

  
}

OnAdded("icon",function(){
  let name = this.getAttribute("name");
  let text = this.getAttribute("text") || "";
  if(name){
    this.innerHTML = `<svg width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">${Bord.Icons.images[name]}</svg> ${text}`;
  }
})


Bord.Icons.Show = function(){
  var parent = document.createElement("div");
  parent.setAttribute("style",`
    padding:1em;
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(100px,1fr));
  `)
  for (const key in Bord.Icons.images) {
    if (Object.hasOwnProperty.call(Bord.Icons.images, key)) {
      const element = Bord.Icons.images[key];
      parent.innerHTML += `<div><icon name="${key}" text="${key}"></icon></div>`;
    }
  }
  Bord.Components.Modal("Icons",parent);
}


/** source\Bord\PDF\Pdf.js  **/
Bord.Pdf= {}

Bord.Pdf.Add = function(bord,options={}){
  options = Object.assign({gray:false,scale:2,invertable:false},options)
  function Load(bord){
    let pdfReader = {
      pdf:null,
      totalKB:0,
      loadAllPages:function(){
        let pageCount = this.pdf.numPages
        console.log("Page Count : "+this.pdf.numPages)
        this.pdf.getPage(1).then((page)=>{
          var viewport = page.getViewport({scale: 1});
          var selectMatrix = new Matrix([...bord.vision.selectRectangleElement.data.m])
          var R = selectMatrix.width() / selectMatrix.height()
          var r = viewport.width / viewport.height
          var _r = r/R // Be carefull
          //if(_r<1) _r=1/_r
          //var l = parseInt( Math.sqrt( pageCount / _r ) )
          var _h = Math.ceil( Math.sqrt( pageCount * _r ) )
          var _w = Math.ceil( pageCount / _h )
          

          
  
          

          console.log( "C",pageCount, "R",R,"r",r, "_r",_r, "_w",_w, "_h",_h )

          var unitMatrix = new Matrix([...selectMatrix.values])
          //unitMatrix.moveGlobal({x:selectMatrix.values[4],y:selectMatrix.values[5]})
          unitMatrix.moveGlobal( selectMatrix.getGlobalPoint({
            x: -1000*(_w-1)/_w,
            y: -1000*(_h-1)/_h
          }))
          unitMatrix.setWidth(selectMatrix.width()/_w)
          unitMatrix.setHeight(selectMatrix.height()/_h)
          //unitMatrix.translateLocal({x:selectMatrix.width()/l,y:selectMatrix.height()/l})



          for(let i=0;i<this.pdf.numPages;i++){
            var y = parseInt(i/_w)
            var x = parseInt(i%_w)
            
            var _matrix = new Matrix([...unitMatrix.values])
            _matrix.translateLocal({x:x*2000,y:y*2000})
            _matrix.scaleLocal(0.9,{x:0,y:0})
            this.loadPage(i+1,_matrix.values)
          }  
        })
        //return this.loadPage(1);
        
      },
      loadPage: function(pageNumber,matrix) {
        this.pdf.getPage(pageNumber).then((page)=>{
          var scale = options.scale;
          var viewport = page.getViewport({scale});
          //console.log(JSON.parse(JSON.stringify(viewport)))
          /*
          if(isNaN(viewport.height) || isNaN(viewport.width)){
            viewport.width = viewport.viewBox[2]
            viewport.height = viewport.viewBox[3] 
          }
          if(isNaN(viewport.transform[0]) || isNaN(viewport.transform[3])){
            viewport.transform = [1,0,0,1,0,0]
          }
          viewport.scale = scale;
          */
          //console.log(JSON.parse(JSON.stringify(viewport)))
          

          var canvas = document.createElement('canvas');
          var context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          var size = {
            width: viewport.width,
            height: viewport.height,
            ratio: viewport.width/viewport.height
          }
          console.log("Size: ", size)

          canvas.style.display = "block";
          canvas.style.position = "fixed";
          canvas.style.top = "0";
          canvas.style.left = "0";
          canvas.style.zIndex = "10000";
          canvas.style.background = "#FFF";
          //document.body.appendChild(canvas);

          //
          // Render PDF page into canvas context
          //
          var renderContext = {
            canvasContext: context,
            viewport: viewport,
            background: 'rgba(0,0,0,0)',
          };
          
          page.render(renderContext).promise.then(()=>{
            // force white background to transparent background
            if(options.gray){
              var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              let data = imageData.data;
              for (var i = 0; i < data.length; i += 4) {
                /*
                if(data[i+3]==0){
                  data[i+2]=255
                  data[i+1]=255
                  data[i]=255
                }else{
                  var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                  //var inverse = 255 - avg;
                  data[i] = avg;
                  data[i + 1] = avg;
                  data[i + 2] = avg;
                }
                data[i+3]=255
                */
                if(data[i+3]==0) continue;
                data[i+3] = 255 - ( (data[i]+data[i+1]+data[i+2])/3 );
                data[i] = 0;
                data[i+1] = 0;
                data[i+2] = 0;
              }
              context.putImageData(imageData, 0, 0);
            }
            // Canvas image to png 
            var imgData = canvas.toDataURL("image/png", 1);
            this.totalKB += imgData.length/1024
            console.log(imgData.length/1024,"KB", "total:", this.totalKB,"KB")
            var img = document.createElement("img");
            //console.log(imgData);
            //bord.vision.add.newMedia("image",{url:imgData,invertable:options.invertable},true);

            let data = {
              url:imgData,
              invertable:options.invertable,
            }
            var container = bord.vision.add.newContainer(size.ratio,"image",data,true,matrix)
            Bord.Vision.Medias.image.init(container,data)
            container.data.type = "image"
            bord.emit("mediaAdded",container.data)
          });
        });
      }
    }

    // window.pdfReader = pdfReader;

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = event => {
      var file = event.target.files[0];
      //Step 2: Read the file using file reader
      var fileReader = new FileReader();  
      fileReader.onload = function() {
          //Step 4:turn array buffer into typed array
          var typedarray = new Uint8Array(this.result);
          //Step 5:pdfjs should be able to read this
          console.log(pdfjsLib)
          const loadingTask = window.pdfjsLib.getDocument(typedarray);
          loadingTask.promise.then(pdf => {
              pdfReader.pdf = pdf;
              pdfReader.loadAllPages();
          });
                      
  
      };
      //Step 3:Read the file as ArrayBuffer
      fileReader.readAsArrayBuffer(file);
      
      /*
      pdfjsLib.getDocument(URL.createObjectURL(e.target.files[0])).promise.then(pdf => {
        pdfReader.pdf = pdf;
        pdfReader.loadPage(1);
      });
      */
    }
    input.click();

  }

  

  //<script src="//mozilla.github.io/pdf.js/build/pdf.js"></script>
  if(!Bord.Pdf.isLoaded){
    /*
    define('main', ['pdfjs-dist/build/pdf'], function(pdfjsLib, viewer, require) {
      window.pdfjsLib = pdfjsLib;
      Bord.Pdf.isLoaded = true;
      Load(bord);
    })
    */
    /*
    require(["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"],function(a,b,c){
      define('main', ['pdfjs-dist/build/pdf', 'pdfjs-dist/web/pdf_viewer'], function(pdfjsLib, viewer, require) {
        window.pdfJsLib = pdfjsLib;
        Bord.Pdf.isLoaded = true;
        Load(bord);
      });
    })
    */
    
    /*
    let script = document.createElement("script")
    //script.src="//mozilla.github.io/pdf.js/build/pdf.js"
    //script.src="/public/vendor/pdf.js/pdf.js"
    script.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"
    script.onload = function(){
      Bord.Pdf.isLoaded = true
      Load(bord)
    }  
    document.head.appendChild(script)
    */
    // Currently Fast Loading Active
    Bord.Pdf.isLoaded = true
    Load(bord)
  }else{
    Load(bord)
  }
  
}
/** source\Bord\PDF\require.js  **/

/** source\Bord\Presentation\Presentation.js  **/
Bord.Presentation.Init = function(bord){
  let presentation = bord.presentation = {}
  Bord.Presentation.Presentation.apply(bord,bord)
  let vision = bord.vision
  

  // TODO: Enable This
  // let vision = bord.vision
  //@edit
  vision.add.coordinate = function(){
    var name = prompt("Name of the coordinate")
    if(name){
      if(vision.selectRectangleElement){
        vision.coordinates.push({
          name:name,
          x:vision.selectRectangleElement.data.m[4],
          y:vision.selectRectangleElement.data.m[5],
          s:vision.camera.s
        });
      }else{
        vision.coordinates.push({
          name: name,
          x: vision.camera.x,
          y: vision.camera.y,
          s: vision.camera.s
        });
      }
    }
  }
  //@endedit

  ////@view
  bord.on("load",function(data){
    Bord.Presentation.Views.renderView(vision.coordinates)
  })
  ////@endview
}



/** source\Bord\Vision\BeatifyShape.js  **/
var Bord = Bord || {};
Bord.Vision = Bord.Vision || {};
/** @param {Array<number>} points */
Bord.Vision.BeatifyShape = function (points,matrix) {

  const CIRCLE_MASS_CENTER_DELTA = 100;
  const CIRCLE_MASS_VALUE = 5500; 
  const NEAR_CROSS_POINT_DISTANCE = 200;

  // TODO: Normalize points
  // TODO: Revert Points

  const index = (num,length=points.length)=>{
    if(num>=length){
      return num-length;
    }
    if(num<0){
      return num+length;
    }
    return num;
  }

  function RemoveDuplicates(points){
    let newPoints = [];
    for(let i=0;i<points.length;i+=2){
      if(newPoints.find((e=>e[0]==points[i]&&e[1]==points[i+1]))){
        continue;
      }else{
        newPoints.push([points[i],points[i+1]]);
      }
    }
    return newPoints.flat();
  }

  function NormalizePoints(points){

  }
  function CrossAngle(a,b){
    let diff = a-b;
    diff=Math.abs(diff);
    diff=diff%180;
    if(diff>90){
      diff=180-diff;
    }
    return diff;
  }
  function VerticalSymmetry(points,isOpen=false){
    let angles = [];
    let interiorAngles = [];
    console.log(points);
    for (let i = 0; i < points.length; i+=2) {
      let x0 = points[index(i+0,points.length)];
      let y0 = points[index(i+1,points.length)];
      let x1 = points[index(i+2,points.length)];
      let y1 = points[index(i+3,points.length)];
      let x2 = points[index(i+4,points.length)];
      let y2 = points[index(i+5,points.length)];
      let angle0 = Math.atan2(y0-y1,x1-x0) * 180 / Math.PI;
      let angle1 = Math.atan2(y1-y2,x2-x1) * 180 / Math.PI;
      angles.push(angle0);
      interiorAngles.push(CrossAngle(angle1,angle0));
    }
    interiorAngles.pop();
    if(isOpen) interiorAngles.pop();
    console.log("angles",angles);
    console.log("interiorAngles",interiorAngles);

    for(let i=0;i<interiorAngles.length;i++){
      if(interiorAngles[i]>80){
        // Cross Angle Detected
        let centerx = (points[index(i*2+0,points.length)]+points[index(i*2+4,points.length)])/2;
        let centery = (points[index(i*2+1,points.length)]+points[index(i*2+5,points.length)])/2;
        let radius = Math.sqrt(Math.pow(points[index(i*2+0,points.length)]-points[index(i*2+4,points.length)],2)+Math.pow(points[index(i*2+1,points.length)]-points[index(i*2+5,points.length)],2)) / 2;
        let rayX = points[index(i*2+2,points.length)] - centerx
        let rayY = points[index(i*2+3,points.length)] - centery
        rayY = -rayY;
        let directionAngle = Math.atan2(rayY,rayX) * 180 / Math.PI;
        console.log("center",centerx,centery)
        console.log("radius",radius);
        console.log("directionAngle",directionAngle);
        points[index(i*2+2,points.length)] = centerx + Math.cos(directionAngle * Math.PI / 180)*radius;
        points[index(i*2+3,points.length)] = centery - Math.sin(directionAngle * Math.PI / 180)*radius;
      }
    }

    return points;
  }

  points = points.map(e=>e);
  // remove duplicates

  let angles = [];
  let angleDiff = [];
  let distances = [];
  // Mass, MassX, MassY
  let mass = 0;
  let massX = 0;
  let massY = 0;
  // Center Distances
  let centerDistances = [];

  for(let i = 2; i < points.length; i += 2) {
    let x0 = points[index(i - 2,points.length)];
    let y0 = points[index(i - 1,points.length)];
    let x1 = points[index(i + 0,points.length)];
    let y1 = points[index(i + 1,points.length)];
    let cx = (x0 + x1) / 2;
    let cy = (y0 + y1) / 2;
    let distance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    let angle = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    angles.push(angle);
    distances.push(distance);
    if(i>2) {
      // Angle difference
      let diff = angle - angles[angles.length - 2];
      if(diff < 0) diff = 360 + diff;
      if(diff > 180) diff = 360 - diff;
      diff = Math.abs(diff);
      angleDiff.push( diff );
    }
    // Mass
    if(distance>0){
      let t = (mass / (distance + mass));
      massX = cx + (massX-cx) * t;
      massY = cy + (massY-cy) * t;
      mass += distance;
    }
    // Center Distances
    centerDistances.push(Math.sqrt(Math.pow(cx - massX, 2) + Math.pow(cy - massY, 2)));
  }

  let angleDiff2 = [];
  for(let i = 0; i < angleDiff.length; i++) {
    let diff = angleDiff[i] - angleDiff[index(i + 1,angleDiff.length)];
    if(diff < 0) diff = 360 + diff;
    if(diff > 180) diff = 360 - diff;
    diff = Math.abs(diff);
    angleDiff2.push( diff );
  }
  //angleDiff=angleDiff2;
  function StandardDeviation(values){
    var avg = values.reduce((sum, value) => sum + value, 0) / values.length;

    var squareDiffs = values.map(function(value){
      var diff = value - avg;
      var sqrDiff = diff * diff;
      return sqrDiff;
    });

    var avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / squareDiffs.length;

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  }
  let standardDeviation = StandardDeviation(angleDiff);

  let maxAngleDiff = Math.max(...angleDiff);
  let minAngleDiff = Math.min(...angleDiff);
  let angleDiffRange = maxAngleDiff - minAngleDiff;
  let angleDiffOffset = -minAngleDiff;
  let angleDiffScale = 1 / angleDiffRange;
  let averageAngleDiff = angleDiff.reduce((a, b) => a + b, 0) / angleDiff.length;
  let geometricalAverage = Math.pow(angleDiff.reduce((a, b) => a * (b<1 ? 1 : b), 1), 1 / distances.length);
  let crossCount = angleDiff.filter(e=>e>geometricalAverage*2 && e > 20).length;

  let startStopDistance = Math.sqrt(Math.pow(points[0] - points[points.length - 2], 2) + Math.pow(points[1] - points[points.length - 1], 2)) / 1000;

  let sortedAngleDiff = angleDiff.slice().sort((a, b) => a - b).reverse().filter((e,i)=>i<5);

  let geometricalCenterDistance = Math.pow(centerDistances.reduce((a, b) => a * (b<1 ? 1 : b), 1), 1 / distances.length);
  let averageCenterDistances = centerDistances.reduce((a, b) => a + b, 0) / centerDistances.length;

  let crossPointIndex = [];
  let crossPoints = [];
  for(let i = 0; i < crossCount; i++) {
    // find the biggest angle diff index
    let angleDiffIndex=angleDiff.indexOf(sortedAngleDiff[i])+1;
    crossPointIndex.push(angleDiffIndex);
  }  
  crossPointIndex.sort((a, b) => a - b);
  for(let i = 0; i < crossCount; i++) {
    let index = crossPointIndex[i];
    let point = [points[index*2], points[index*2+1]];
    crossPoints.push(point);
  }
  
  //-- remove nearby points --//
  for(let i = 0; i < crossPoints.length; i++) {
    for(let j = i+1; j < crossPoints.length; j++) {
      let distance = Math.sqrt(Math.pow(crossPoints[i][0] - crossPoints[j][0], 2) + Math.pow(crossPoints[i][1] - crossPoints[j][1], 2)) ;
      if(distance<NEAR_CROSS_POINT_DISTANCE){
        crossPoints.splice(j,1);
        j--;
      }
    }
  }
  //-- recalculate crossCount --//
  crossCount = crossPoints.length;

  for(let i =0;i<crossCount;i++){
    let point = crossPoints[i];
    //let debug_temp = Bord.Vision.Shapes.Create("circle",{"cx":point[0],"cy":point[1],r:"50","stroke":"green","style":"stroke-width:"+vision.stroke.value+"px"})
    //debug_temp.style.transform = "matrix("+matrix.join(",")+")"
    //vision.elements.camera.append(debug_temp)
    //setTimeout(()=>debug_temp.remove(),1000)
  }

  

  console.log("mass", mass,"x", massX,"y" ,massY);
  console.log("maxAngleDiff", maxAngleDiff);
  console.log("minAngleDiff", minAngleDiff);
  console.log("angleDiffRange", angleDiffRange);
  console.log("angleDiffOffset", angleDiffOffset);
  console.log("angleDiffScale", angleDiffScale);
  console.log("averageAngleDiff", averageAngleDiff);
  console.log("geometricalAveragee", geometricalAverage);
  console.log("geometryCenterDistances", geometricalCenterDistance);
  console.log("averageCenterDistances", averageCenterDistances);
  console.log("standardDeviation", standardDeviation);
  console.log("crossCount", crossCount);
  console.log("startStopDistance", startStopDistance);
  console.log("sortedAngleDiff", sortedAngleDiff);

  // Straight line
  if(maxAngleDiff < 10) {
    // Green color console log
    console.log("%cStraight line", "color: green; font-weight: bold");
    return [ points[0], points[1], points[points.length - 2], points[points.length - 1] ];
  }

  // Circle
  if( standardDeviation<7 && mass>CIRCLE_MASS_VALUE && Math.abs(massX)<CIRCLE_MASS_CENTER_DELTA && Math.abs(massY)<CIRCLE_MASS_CENTER_DELTA ) {
    // Green color console log
    console.log("%cCircle", "color: green; font-weight: bold");
    let circle = [];
    for(let i=0;i<=360;i+=5){
      let x = Math.cos(i * Math.PI / 180) * 1000;
      let y = Math.sin(i * Math.PI / 180) * 1000;
      circle.push(x,y);
    }
    return circle;
  }

  // Closed Polygon
  if(crossCount > 0 && startStopDistance<0.2) {
    // Green color console log
    let response = [points[0],points[1]].concat(...crossPoints);
    response = RemoveDuplicates(response);
    response = VerticalSymmetry(response,false);
    response.push(response[0],response[1]);
    console.log("%cPolygon "+(response.length/2), "color: green; font-weight: bold");
    return response;
  }

  // Open polygon
  if(crossCount > 0 && startStopDistance>0.2) {
    // Green color console log
    console.log("%cOpen polygon "+(crossCount+1), "color: green; font-weight: bold");
    let response = [points[0],points[1]].concat(...crossPoints).concat([points[points.length-2],points[points.length-1]]);
    response = RemoveDuplicates(response);
    response = VerticalSymmetry(response,true);
    return response;
  }

  return false;

};

/** @param {Array<number>} points */
Bord.Vision.BeatifyShape.Path = function (points) {
  let _points = points.filter((e,i)=>i%8==0||i%8==1).map(e=>e/1000);
  return Bord.Vision.BeatifyShape(_points);
}
/** source\Bord\Vision\Buttons.js  **/
OnAdded(".bord--buttons--container .bord--button--round",function(e){
  /** @type {HTMLElement} */
  let item = e;
  // Find Item Index
  let index = Array.from(item.parentElement.children).indexOf(item);
  item.style.setProperty("--index",index);
})

OnAdded(".bord--buttons--right",function(e){
  /** @type {HTMLElement} */
  let item = e;
  item.onclick=function(e){
    item.classList.toggle("bord--button--active");
  }
})

OnAdded(".bord--buttons--down",function(e){
  /** @type {HTMLElement} */
  let item = e;
  item.onclick=function(e){
    item.classList.toggle("bord--button--active");
  }
})
/** source\Bord\Vision\Matrix.js  **/
/**
 * A basic matrix class for 2D matrices.
 */
class Matrix{
  constructor(values,element){
    this.values = values
    this.element = element;
  }

  /** @param {HTMLElement|SVGElement} element */
  static fromElement(element){
    if(element.style.transform){
      return new Matrix(element.style.transform.split('(')[1].split(')')[0].split(',').map(Number),element)
    }else{
      return new Matrix([1,0,0,1,0,0],element)
    }
  }

  static identity(){
    return new Matrix([1,0,0,1,0,0])
  }

  apply(values=null){
    if(values!=null) this.values = values;
    if(this.element){
      this.element.style.transform = `matrix(${this.values.join(',')})`;
    }
    return values
  }
  //------------ Informations ------------------//
  static width(m){
    return Math.sqrt(m[0]*m[0] + m[1]*m[1]);
  }
  width(){
    return Matrix.width(this.values)
  }
  static setWidth(m,value){
    var width = Math.sqrt(m[0]*m[0] + m[1]*m[1]);
    m[0] = (m[0]/width)*value;
    m[1] = (m[1]/width)*value;
    return m;
  }
  setWidth(value){
    return this.apply( Matrix.setWidth(this.values,value) )
  }

  static height(m){
    return Math.sqrt(m[2]*m[2] + m[3]*m[3]);
  }
  height(){
    return Matrix.height(this.values)
  }
  static setHeight(m,value){
    var height = Math.sqrt(m[2]*m[2] + m[3]*m[3]);
    m[2] = (m[2]/height)*value;
    m[3] = (m[3]/height)*value;
    return m;
  }
  setHeight(value){
    return this.apply( Matrix.setHeight(this.values,value) )
  }

  static rotation(m){
    return Math.atan2(m[1],m[0]);
  }
  rotation(){
    return Matrix.rotation(this.values)
  }
  
  static setRotation(m,rad){
    var cos = Math.cos(rad),
        sin = Math.sin(rad),
        width = Matrix.width(m),
        height = Matrix.height(m);
    m[0] = width*cos;
    m[1] = -width*sin;
    m[2] = height*sin;
    m[3] = height*cos;
    return m;
  }
  setRotation(angle){
    return this.apply( Matrix.setRotation(this.values,angle) )
  }

  //----------- Bound -----------//
  static getGlobalRectangle(m,w=1,h=1){
    var scale = Matrix.getGlobalPoint(m,{x:w,y:h});
    scale.x = Math.abs( m[4] - scale.x);
    scale.y = Math.abs( m[5] - scale.y);
    return{
      x: m[4],
      y: m[5],
      w: scale.x,
      h: scale.y,
      width: scale.x*2,
      height: scale.y*2,
      left: m[4]-scale.x,
      top: m[5]-scale.y,
      right: m[4]+scale.x,
      bottom: m[5]+scale.y
    }
  }
  getGlobalRectangle(w=1,h=1){
    return Matrix.getGlobalRectangle(this.values,w,h)
  }


  //------------ Transform Points -------------------//
  static getGlobalPoint(m,localPoint){
    return {
      x: m[0]*localPoint.x + m[2]*localPoint.y + m[4],
      y: m[1]*localPoint.x + m[3]*localPoint.y + m[5]
    };
  }
  getGlobalPoint(localPoint){
    return Matrix.getGlobalPoint(this.values,localPoint);
  }

  static getLocalPoint(m,worldPoint){
    var det = m[0]*m[3] - m[1]*m[2];
    if(det && !isNaN(det) ){
      var x = worldPoint.x - m[4],
          y = worldPoint.y - m[5];
      return {
        x: (m[3]*x - m[2]*y)/det,
        y: (m[0]*y - m[1]*x)/det
      };
    }else{
      return null;
    }    
  }
  getLocalPoint(worldPoint){
    return Matrix.getLocalPoint(this.values,worldPoint);
  }
  //---------------- Move ------------------//
  /**
   * Set new position of the matrix.
   */
  static moveGlobal(m,globalPoint){
    m[4] = globalPoint.x;
    m[5] = globalPoint.y;
    return m;
  }
  moveGlobal(globalPoint){
    return this.apply( Matrix.moveGlobal(this.values,globalPoint) )
  }

  static translateGlobal(m,globalDelta){
    m[4] += globalDelta.x;
    m[5] += globalDelta.y;
    return m;
  }

  translateGlobal(globalDelta){
    return this.apply( Matrix.translateGlobal(this.values,globalDelta) )
  }
  /**
   * Set position of the matrix for local point
   */
  static moveLocal(m,localPoint){
    var delta = Matrix.getGlobalPoint(m,localPoint);
    m[4] = delta.x;
    m[5] = delta.y;
    return m;
  }
  moveLocal(localPoint){
    return this.apply( Matrix.moveLocal(this.values,localPoint) )
  }

  static translateLocal(m,localDelta){
    var delta = Matrix.getGlobalPoint(m,localDelta);
    m[4] = delta.x;
    m[5] = delta.y;
    return m;
  }
  translateLocal(localDelta){
    return this.apply( Matrix.translateLocal(this.values,localDelta) )
  }

  //----------------- Scale -----------------//
  static scaleGlobal(m,scale,centerGlobal){
    var centerLocal = Matrix.getLocalPoint(m,centerGlobal);
    Matrix.moveLocal(m,centerLocal);
    m[0] *= scale;
    m[1] *= scale;
    m[2] *= scale;
    m[3] *= scale;
    Matrix.moveLocal(m,{x:-centerLocal.x,y:-centerLocal.y});
    return m;
  }
  scaleGlobal(scale,centerGlobal){
    return this.apply( Matrix.scaleGlobal(this.values,scale,centerGlobal) )
  }

  static scaleLocal(m,scale,centerLocal){
    Matrix.moveLocal(m,centerLocal);
    m[0] *= scale;
    m[1] *= scale;
    m[2] *= scale;
    m[3] *= scale;
    Matrix.moveLocal(m,{x:-centerLocal.x,y:-centerLocal.y});
    return m;
  }
  scaleLocal(scale,centerLocal){
    return this.apply( Matrix.scaleLocal(this.values,scale,centerLocal) )
  }

  //----------------- Rotate -----------------//
  static rotateFromCenter(m,angle){
    var width = Matrix.width(m),
        height = Matrix.height(m),
        aspect = width/height;
    Matrix.setWidth( m , height );
    var cos = Math.cos(angle),
        sin = Math.sin(angle),
        tx = m[4],
        ty = m[5],
        a = m[0],
        b = m[1],
        c = m[2],
        d = m[3];
    m[0] = cos*a + sin*c;
    m[1] = cos*b + sin*d;
    m[2] = -sin*a + cos*c;
    m[3] = -sin*b + cos*d;
    Matrix.setWidth( m , width );
    return m;
  }
  rotateFromCenter(angle){
    return this.apply( Matrix.rotateFromCenter(this.values,angle) )
  }
  /**
   * @param {number} angle in radians
   */
  static rotateGlobal(m,angle,centerGlobal){
    var centerLocal = Matrix.getLocalPoint(m,centerGlobal);
    Matrix.moveLocal(m,centerLocal);
    Matrix.rotateFromCenter(m,angle);
    Matrix.moveLocal(m,{x:-centerLocal.x,y:-centerLocal.y});
    return m;
  }

  rotateGlobal(angle,centerGlobal){
    return this.apply( Matrix.rotateGlobal(this.values,angle,centerGlobal) )
  }

  static rotateLocal(m,angle,centerLocal){
    Matrix.moveLocal(m,centerLocal);
    Matrix.rotateFromCenter(m,angle);
    Matrix.moveLocal(m,{x:-centerLocal.x,y:-centerLocal.y});
    return m;
  }
  rotateLocal(angle,centerLocal){
    return this.apply( Matrix.rotateLocal(this.values,angle,centerLocal) )
  }

}

//@test
(function(){
  if(TEST_MODE==false) return;
  //- TESTING
  var matrix = Matrix.identity();
  Test.equal(matrix.values,[1,0,0,1,0,0],"Matrix.identity()");
  //- Information
  Test.equal( Matrix.width( [0,-1,-1,0,0,0] ), 1, "Matrix.width()" );
  Test.equal( Matrix.width( [1,0,0,5,0,0] ), 1, "Matrix.height()" );
  
  //- Get Local & Global Point 

  Test.equal( Matrix.getGlobalPoint([1,0,0,1,0,0],{x:10,y:10}), {x:10,y:10} , "Matrix.getGlobalPoint" )
  Test.equal( Matrix.getGlobalPoint([2,0,0,2,0,0],{x:10,y:10}), {x:20,y:20} , "Matrix.getGlobalPoint" )
  Test.equal( Matrix.getGlobalPoint([2,0,0,2,10,10],{x:10,y:10}), {x:30,y:30} , "Matrix.getGlobalPoint" )
  
  Test.equal( Matrix.getLocalPoint([1,0,0,1,0,0],{x:10,y:10}), {x:10,y:10} , "Matrix.getLocalPoint" )
  Test.equal( Matrix.getLocalPoint([2,0,0,2,0,0],{x:20,y:20}), {x:10,y:10} , "Matrix.getLocalPoint" )
  Test.equal( Matrix.getLocalPoint([2,0,0,2,10,10],{x:30,y:30}), {x:10,y:10} , "Matrix.getLocalPoint" )

  var rotated90degMatrix = new Matrix([0,1,-1,0,0,0]);
  Test.equal( rotated90degMatrix.getGlobalPoint({x:10,y:0}), {x:0,y:10} , "Matrix.getGlobalPoint" )
  Test.equal( rotated90degMatrix.getGlobalPoint({x:-10,y:0}), {x:0,y:-10} , "Matrix.getGlobalPoint" )
  Test.equal( rotated90degMatrix.getGlobalPoint({x:0,y:10}), {x:-10,y:0} , "Matrix.getGlobalPoint" )
  Test.equal( rotated90degMatrix.getGlobalPoint({x:10,y:10}), {x:-10,y:10} , "Matrix.getGlobalPoint" )

  //- Move Global & Local 
  Test.equal( Matrix.moveGlobal([1,0,0,1,20,0],{x:10,y:10}), [1,0,0,1,10,10], "Matrix.moveGlobal" )
  Test.equal( Matrix.moveGlobal([0,1,-1,0,0,0],{x:20,y:10}), [0,1,-1,0,20,10], "Matrix.moveGlobal" )

  Test.equal( Matrix.moveLocal([1,0,0,1,0,0],{x:10,y:10}), [1,0,0,1,10,10], "Matrix.moveLocal" )
  Test.equal( Matrix.moveLocal([0,1,-1,0,0,0],{x:10,y:0}), [0,1,-1,0,0,10], "Matrix.moveLocal" )
  Test.equal( Matrix.moveLocal([2,0,0,2,0,0],{x:10,y:10}), [2,0,0,2,20,20], "Matrix.moveLocal" )
  
  //- Scale Global & Local
  Test.equal( Matrix.scaleGlobal([1,0,0,1,0,0],2,{x:-10,y:-10}), [2,0,0,2,10,10], "Matrix.scaleGlobal" )
  // Test.equal( Matrix.scaleLocal([2,0,0,2,10,10],4,{x:-2,y:0}), [8,0,0,8,0,10], "Matrix.scaleLocal" )


})();
//@endtest
/** source\Bord\Vision\PointerEvents.js  **/
// TODO: ALERT: Mobile problem here
Bord.Vision.PointerEvents = function (vision,PointerAny,PointerDown,PointerMove,PointerUp,PointerThen) {
  vision.pointerEvents = []

  function GetPointerEventIndex(e) {
    for (var i = 0; i < vision.pointerEvents.length; i++) {
      if (vision.pointerEvents[i].pointerId == e.pointerId) {
        return i
      }
    }
    return -1;
  }

  function PointerEventDefine(e) {
    if (GetPointerEventIndex(e) != -1) {
      vision.pointerEvents[GetPointerEventIndex(e)] = e
    } else {
      vision.pointerEvents.push(e)
    }
  }

  function PointersDefine() {
    // If any touch, return touch events
    if (vision.pointerEvents.some(e => e.pointerType == "touch")) {
      return vision.pointers = vision.pointerEvents.filter(e => (["pointerup", "pointerout", "pointerleave", "pointercancel"].indexOf(e.type) > -1 || e.buttons > 0) && e.pointerType == "touch")
    }
    // If any pen, return pen events
    if (vision.pointerEvents.some(e => e.pointerType == "pen")) {
      return vision.pointers = vision.pointerEvents.filter(e => (["pointerup", "pointerout", "pointerleave", "pointercancel"].indexOf(e.type) > -1 || e.buttons > 0) && e.pointerType == "pen")
    }
    // If any mouse return mouse events
    return vision.pointers = vision.pointerEvents.filter(e => (["pointerup", "pointerout", "pointerleave", "pointercancel"].indexOf(e.type) > -1 || e.buttons > 0) && e.pointerType == "mouse")
  }

  function PointerDownHandler(e) {
    // Pen Fix
    if(e.pointerType != "pen"){
      vision.pointerEvents = vision.pointerEvents.filter(e => e.pointerType != "pen")
    }
    // PointerEventDefine
    PointerEventDefine(e)
    // Call
    if( PointerAny(PointersDefine(),"pointerdown") !== false ) {
      PointerDown(PointersDefine())
      PointerThen(PointersDefine(),"pointerdown")
    }
  }

  function PointerMoveHandler(e) {
    // Add Point If Mouse Downed
    if (e.buttons > 0 && GetPointerEventIndex(e) != -1) {
      // Add Button Here
    }
    // PointerEventDefine
    PointerEventDefine(e)
    // Call
    if( PointerAny(PointersDefine(),"pointermove") !== false ) {
      PointerMove(PointersDefine())
      PointerThen(PointersDefine(),"pointermove")
    }
  }

  function PointerUpHandler(e) {
    // Add Point
    if (e.buttons > 0 && GetPointerEventIndex(e) != -1) {
      // Add Button Here
    }

    // ReDefine
    let define = PointersDefine()
    define = define.map(event => ({
      type: event.pointerId==e.pointerId ? "pointerup" : event.type,
      clientX: event.pointerId==e.pointerId ? e.clientX : event.clientX,
      clientY: event.pointerId==e.pointerId ? e.clientY : event.clientY,
      buttons: event.pointerId==e.pointerId ? e.buttons : event.buttons,
      pointerId: event.pointerId==e.pointerId ? e.pointerId : event.pointerId,
      target: event.pointerId==e.pointerId ? e.target : event.target,
    }))
    
    if (define.length != 0){
      if( PointerAny(define,"pointerup") !== false ) {
        PointerUp(define)
        PointerThen(define,"pointerup")
      }
    }
    // Remove Upped Event
    vision.pointerEvents = vision.pointerEvents.filter(event => event.pointerId != e.pointerId)
  }

  vision.elements.frame.onpointerdown = PointerDownHandler;
  vision.elements.frame.onpointermove = PointerMoveHandler;
  vision.elements.frame.onpointerup = PointerUpHandler;
  vision.elements.frame.onpointercancel = PointerUpHandler;
  //vision.elements.frame.onpointerout = PointerOutHandler;
  vision.elements.frame.onpointerleave = PointerUpHandler;
  /*
  vision.elements.frame.onclick = function(event){
    let e = Object.assign({},event)
    e.pointerId = 1
    e.type="pointerdown"
    PointerAny([e],"pointerdown")
    PointerDown([e])
    e.type="pointermove"
    PointerAny([e],"pointermove")
    PointerMove([e])
    e.type="pointerup"
    PointerAny([e],"pointerup")
    PointerUp([e])
  }
  */
}
/** source\Bord\Vision\Shapes.js  **/
Bord.Vision.Shapes = {
  Create : function(tag,attrs={},children=[]){
    var el = document.createElementNS("http://www.w3.org/2000/svg",tag);
    el.setAttribute("xmlns","http://www.w3.org/2000/svg")
    for(let key in attrs ){
      el.setAttribute(key,attrs[key])
    }
    for(let child of children){
      el.append(child)
    }
    return el;
  }
}

/** source\Bord\Vision\Transform.js  **/

Bord.Vision.Transform = {}

//=============== Normalize ===============//

//----------------- NormalizePath -----------------//
/**
 * @param {[{x:number,y:number}]} points
 * @returns {m:number[],p:number[{x:number,y:number},b:{x:number,y:number}]}
 */
 Bord.Vision.Transform.Normalize = function (points,k=1,square=false) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  
  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    if (p.x < minX) {
      minX = p.x;
    }
    if (p.x > maxX) {
      maxX = p.x;
    }
    if (p.y < minY) {
      minY = p.y;
    }
    if (p.y > maxY) {
      maxY = p.y;
    }
  }

  let x = (maxX + minX) / 2;
  let y = (maxY + minY) / 2;
  let w = (maxX - minX) / 2;
  let h = (maxY - minY) / 2;

  if (w == 0) w = 1
  if (h == 0) h = 1

  
  // Ratio W, RatioH
  let ratio = 1;
  let rw = 1, rh = 1;
  if(square){
    ratio = w / h;
    if(ratio>1){
      rh = 1 / ratio
    }else{
      rw = ratio
    }
  }
  
  console.log(minX,minY,maxX,maxY,rw,rh)
  let _points = []
  for (let i = 0; i < points.length; ++i) {
    _points[i] = {}
    _points[i].x = rw * k * (points[i].x - x) / w;
    _points[i].y = rh * k * (points[i].y - y) / h;
    if (isNaN(_points[i].x)) {
      _points[i].x = 0;
    }
    if (isNaN(_points[i].y)) {
      _points[i].y = 0;
    }
  }

  let drawing = {}
  drawing.p = _points
  drawing.m = [ w / k / rw, 0, 0, h / k / rh, x, y]
  drawing.b = [k*rw,k*rh]
  return drawing
}

//-- Convert Array --//
/** @param {number[][]} arrays  @returns {[number]} */
Bord.Vision.Transform.ArrayJoin = function(arrays){
  let _arrays = []
  for (let i = 0; i < arrays.length; i++) {
    _arrays = _arrays.concat(arrays[i])
  }
  return _arrays
}
/** @param {number[]} arrays  @returns {number[][]} */
Bord.Vision.Transform.ArraySplit = function(arrays,k=1){
  let _arrays = []
  for (let i = 0; i < arrays.length; i+=k) {
    _arrays.push(arrays.slice(i,i+k))
  }
  return _arrays
}
/** @param {number[]} array  @returns {[{x:number,y:number}]} */
Bord.Vision.Transform.ArrayToPoint = function (array) {
  let points = []
  for (let i = 0; i < array.length; i += 2) {
    points.push({
      x: array[i],
      y: array[i + 1]
    })
  }
  return points
}

//@test
if(TEST_MODE){
  Test.equal( Bord.Vision.Transform.ArrayJoin([[1,2],[3,4],[5,6]]),[1,2,3,4,5,6],'Transform.ArrayJoin') 
  Test.equal( Bord.Vision.Transform.ArraySplit([1,2,3,4,5,6],2),[[1,2],[3,4],[5,6]],'Transform.ArraySplit')
  Test.equal( Bord.Vision.Transform.ArraySplit([1,2,3,4,5,6],3),[[1,2,3],[4,5,6]],'Transform.ArraySplit')
  Test.equal( Bord.Vision.Transform.ArrayToPoint([1,2,3,4,5,6]),[{x:1,y:2},{x:3,y:4},{x:5,y:6}],'Transform.ArrayToPoint')
}
//@endtest




//==== Point & Lerp & Quadratic Curve & Cubic Curve   ====

Bord.Vision.Transform.Point = function (data,y) {
  if(y!=undefined){
    var that = [data,y]
    that.x = data
    that.y = y
    return that
  }
  if(data instanceof Array){
    var that = data;
    that.x = data[0]
    that.y = data[1]
    return that;
  }else{
    var that = [data.x,data.y]
    that.x=data.x
    that.y=data.y
    return that;
  }
}

Bord.Vision.Transform.Lerp = function(a,b,t){
  return a*(1-t)+b*t
}

Bord.Vision.Transform.LerpPoint = function(p1,p2,t){
  if(p1 instanceof Array) p1 = {x:p1[0],y:p1[1]}
  if(p2 instanceof Array) p2 = {x:p2[0],y:p2[1]}
  return this.Point({
    x:Bord.Vision.Transform.Lerp(p1.x,p2.x,t),
    y:Bord.Vision.Transform.Lerp(p1.y,p2.y,t)
  })
}

Bord.Vision.Transform.QuadraticBezierPoint = function (p1,p2,p3,t) {
  if(p1 instanceof Array) p1 = {x:p1[0],y:p1[1]}
  if(p2 instanceof Array) p2 = {x:p2[0],y:p2[1]}
  if(p3 instanceof Array) p3 = {x:p3[0],y:p3[1]}
  let c1 = Bord.Vision.Transform.LerpPoint(p1,p2,t)
  let c2 = Bord.Vision.Transform.LerpPoint(p2,p3,t)
  return this.Point( Bord.Vision.Transform.LerpPoint(c1,c2,t) )
}

Bord.Vision.Transform.CubicBezierPoint = function (p1,p2,p3,p4,t) {
  if(p1 instanceof Array) p1 = {x:p1[0],y:p1[1]}
  if(p2 instanceof Array) p2 = {x:p2[0],y:p2[1]}
  if(p3 instanceof Array) p3 = {x:p3[0],y:p3[1]}
  if(p4 instanceof Array) p4 = {x:p4[0],y:p4[1]}
  let c1 = Bord.Vision.Transform.LerpPoint(p1,p2,t)
  let c2 = Bord.Vision.Transform.LerpPoint(p2,p3,t)
  let c3 = Bord.Vision.Transform.LerpPoint(p3,p4,t)
  let c4 = Bord.Vision.Transform.LerpPoint(c1,c2,t)
  let c5 = Bord.Vision.Transform.LerpPoint(c2,c3,t)
  return this.Point( Bord.Vision.Transform.LerpPoint(c4,c5,t) )
}


//================= Select & Intersection ====================
/** @param {HTMLElement|SVGElement} element @param {Rectangle} rect */
Bord.Vision.Transform.SelectDrawing = function (element,rect) {
  // In Rectangle
  let inBound = Bord.Vision.Transform.MatrixInRectangle(element.data,rect)
  if(inBound) return true;
  // Intersect Rectangle
  let pointInRectangle = Bord.Vision.Transform.MatrixIntersectionRectangle(element.data,rect)
  if(pointInRectangle==false) return false;
  // Is Any Point In Rectangle
  for (let i = 0; i < element.data.v.length; i+=2) {
    const x = element.data.v[i];
    const y = element.data.v[i+1];
    var point = Matrix.getGlobalPoint(element.data.m,{x,y})
    if(Bord.Vision.Transform.PointInRectangle(point,rect)) return true;
  }

  var x1,y1,x2,y2;
  var vertices = element.data.v;
  for (let i = 2; i < vertices.length; i+=2) {
    x1 = vertices[i-2];
    y1 = vertices[i-1];
    x2 = vertices[i];
    y2 = vertices[i+1];
    //console.log(x1,y1,x2,y2)
    var point1 = Matrix.getGlobalPoint(element.data.m,{x:x1,y:y1})
    var point2 = Matrix.getGlobalPoint(element.data.m,{x:x2,y:y2})
    x1 = point1.x;
    y1 = point1.y;
    x2 = point2.x;
    y2 = point2.y;
    //console.log(x1,y1,x2,y2)
    //vision.log.line(x1,y1,x2,y2)
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.left,rect.top,rect.left,rect.bottom ) ) return true;
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.left,rect.top,rect.right,rect.top ) ) return true;
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.right,rect.top,rect.right,rect.bottom ) ) return true;
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.left,rect.bottom,rect.right,rect.bottom ) ) return true;
  }

  return false;
}

Bord.Vision.Transform.SelectMedia = function (element,rect,acceptInBound=false) {
  // Intersect Rectangle
  let pointInRectangle = Bord.Vision.Transform.MatrixIntersectionRectangle(element.data,rect)
  // TODO: Remove This
  //if(pointInRectangle==false) return false;
  
  // Any Line Intersect
  var x1,y1,x2,y2;
  for (let i = 2; i < element.data.v.length; i+=2) {
    x1 = element.data.v[i-2];
    y1 = element.data.v[i-1];
    x2 = element.data.v[i];
    y2 = element.data.v[i+1];
    var point1 = Matrix.getGlobalPoint(element.data.m,{x:x1,y:y1})
    var point2 = Matrix.getGlobalPoint(element.data.m,{x:x2,y:y2})
    x1 = point1.x;
    y1 = point1.y;
    x2 = point2.x;
    y2 = point2.y;
    //vision.log.line(x1,y1,x2,y2)
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.left,rect.top,rect.left,rect.bottom ) ) return true;
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.left,rect.top,rect.right,rect.top ) ) return true;
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.right,rect.top,rect.right,rect.bottom ) ) return true;
    if(Bord.Vision.Transform.IsIntersectLineByLine(x1,y1,x2,y2,rect.left,rect.bottom,rect.right,rect.bottom ) ) return true;
  }

  if(acceptInBound ){
    // In Rectangle
    let inBound = Bord.Vision.Transform.MatrixInRectangle(element.data,rect)
    if(inBound) return true;
  }

  return false;
}

Bord.Vision.Transform.HightlightPath = function (element) {
  var x1,y1,x2,y2;
  for (let i = 2; i < element.data.v.length; i+=2) {
    x1 = element.data.v[i-2];
    y1 = element.data.v[i-1];
    x2 = element.data.v[i];
    y2 = element.data.v[i+1];
    var point1 = Matrix.getGlobalPoint(element.data.m,{x:x1,y:y1})
    var point2 = Matrix.getGlobalPoint(element.data.m,{x:x2,y:y2})
    x1 = point1.x;
    y1 = point1.y;
    x2 = point2.x;
    y2 = point2.y;
    vision.log.line(x1,y1,x2,y2)
  }
}



Bord.Vision.Transform.InFrame = function(transform,camera){

}

//-------------------- InRectangle--------------------//
/** @param {Drawing} data @param {Rectangle} rect */
Bord.Vision.Transform.MatrixInRectangle = function(data,rect){
  var matrix = data.m;
  var point = Matrix.getGlobalPoint(matrix,{x:data.b[0],y:data.b[1]})
  var x = matrix[4]
  var y = matrix[5]
  var w = Math.abs(x-point.x)
  var h = Math.abs(y-point.y)

  if(x-w<rect.left) return false
  if(y-h<rect.top) return false
  if(x+w>rect.right) return false
  if(y+h>rect.bottom) return false
  return true
}

//-------------- IntersectionRectangle --------------//
/** @param {Drawing} data @param {Rectangle} rect */
Bord.Vision.Transform.MatrixIntersectionRectangle = function(data,rect){
  var matrix = data.m;
  var matrixRect = Matrix.getGlobalRectangle(matrix,data.b[0],data.b[1])
  return  Bord.Vision.Transform.IsOverlap(matrixRect,rect)
}

Bord.Vision.Transform.IsOverlap = function(rect1,rect2){
  if(rect1.left>rect2.right) return false
  if(rect1.right<rect2.left) return false
  if(rect1.top>rect2.bottom) return false
  if(rect1.bottom<rect2.top) return false
  return true
}



//---------------- PointInRectangle ----------------//
Bord.Vision.Transform.PointInRectangle = function(point,rect){
  if(rect.left <= point.x && rect.right >= point.x &&
    rect.top <= point.y && rect.bottom >= point.y){
    return true
  }
  return false
}
//@test
if(TEST_MODE){
  Test.equal( Bord.Vision.Transform.PointInRectangle({x:60,y:100},{left:50,top:90,right:70,bottom:100}),true,"Transform.PointInRectangle")
  Test.equal( Bord.Vision.Transform.PointInRectangle({x:-60,y:100},{left:50,top:90,right:70,bottom:100}),false,"Transform.PointInRectangle")
}
//@endtest

//-------------- IsIntersectLineByLine --------------//
// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
Bord.Vision.Transform.IsIntersectLineByLine = function(a,b,c,d,p,q,r,s){
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
}




//================= Converting Drawing =================//

/**
 * @param {number[][]} points 
 * @returns {string}
 */
Bord.Vision.Transform.PointsToPathData = function(points){
  return points.map((e,i)=>{
    if(i==0){
      return "M"+e[0].join(" ")+"C"+e[1].join(" ")+" "+e[2].join(" ")+" "+e[3].join(" ") 
    }else{
      return "C"+e[1].join(" ")+" "+e[2].join(" ")+" "+e[3].join(" ") 
    }
  })
}

/**
 * @param {string} pathData
 * @returns {number[][]}
 */
Bord.Vision.Transform.PathDataToPoints = function(pathData){
  var points = []
  let list = pathData.match(/(-*\d+)/g).map(e=>int(e))
  for(let i=2;i<list.length;i+=6){
    if(i==2){
      points.push([
        [list[0],list[1]],
        [list[2],list[3]],
        [list[4],list[5]],
        [list[6],list[7]]
      ])
    }else{
      points.push([
        points[points.length-1][3],
        [list[i+0],list[i+1]],
        [list[i+2],list[i+3]],
        [list[i+4],list[i+5]]
      ])
    }
  }
  return points
}

/**
 * TODO: Set Path Drawing
 * @param {HTMLElement|SVGElement} element
 */
Bord.Vision.Transform.PathToDrawing = function(element){

}
/** source\Bord\Vision\Vision.js  **/
/**
 * Opera Problem
 * https://help.opera.com/en/latest/shortcuts/#mouseGestures
 */
Bord.Vision.Medias = {}

/**
 * @param {object} vision
 */
Bord.Vision.Init = function(bord){

  let vision = {}
  bord.vision = vision;
  Bord.Vision.Vision.call(bord,bord)
  
  const Lerp=(a,b,t)=>a+(b-a)*t;
  const LerpLogaritmic=(a,b,t)=>Math.pow(b,t)*Math.pow(a,1-t);

  vision.coordinates = []

  vision.camera = {
    x: 0,
    y: 0,
    s: 10, // TODO: Set this to 1
    innerScaleRatio: 1,
    get scale(){
      return vision.camera.s * vision.camera.innerScaleRatio;
    },
    minScale: 1,
    maxScale: 10,
    stepScale: 0.25,
    frame:{
      left:0,
      top:0,
      width:1920,
      height:1080,
      // Half Width
      w: 1920/2,
      // Half Height
      h: 1080/2,
    },
    // Reel Frame Size (Width,Height)
    size:{
      width:1920,
      height:1080,
    },
    get aspectRatio(){
      return vision.camera.size.width / vision.camera.size.height;
    },
    // Half Frame Position (cx -w,cy -h )
    framePosition: {x:0,y:0},
    framePositionFromClient: function(clientX,clientY){
      return vision.camera.framePosition = {
        x: clientX - vision.camera.frame.w - vision.camera.frame.left,
        y: clientY - vision.camera.frame.h - vision.camera.frame.top
      }
    },
    bordPosition: {x:0,y:0},
    bordPositionFromClient: function(clientX,clientY) {
      return vision.camera.bordPosition = {
        x: (clientX - vision.camera.frame.w - vision.camera.frame.left) / vision.camera.innerScaleRatio ,
        y: (clientY - vision.camera.frame.h - vision.camera.frame.top) / vision.camera.innerScaleRatio
      }
    },
    resize: function(){
      // x: -1 , 1  y: -1 , 1
      vision.camera.frame.w = vision.elements.frame.clientWidth/2;
      vision.camera.frame.h = vision.elements.frame.clientHeight/2;
      let bound = vision.elements.frame.getBoundingClientRect()
      vision.camera.frame={
        left: bound.left,
        top: bound.top,
        width: bound.width,
        height: bound.height,
        w : bound.width/2,
        h : bound.height/2
      }
      let newRatio = vision.camera.frame.w/vision.camera.frame.h;
      if(newRatio < vision.camera.aspectRatio){
        vision.camera.innerScaleRatio = 2 * vision.camera.frame.w / vision.camera.size.width;
      }else{
        vision.camera.innerScaleRatio = 2 * vision.camera.frame.h / vision.camera.size.height;
      }
      
      vision.elements.bordCamera.style.transform=`matrix(${vision.camera.innerScaleRatio},0,0,${vision.camera.innerScaleRatio},${vision.camera.frame.w},${vision.camera.frame.h})`
      vision.elements.border.setAttribute("x"     ,-vision.camera.size.width / 2)
      vision.elements.border.setAttribute("y"     ,-vision.camera.size.height / 2)
      vision.elements.border.setAttribute("width" ,vision.camera.size.width)
      vision.elements.border.setAttribute("height",vision.camera.size.height)
      bord.parent.style.setProperty("--inner-scale",vision.camera.innerScaleRatio)
      vision.camera.render();
    },
    render: function(){
      var frameWidth  = vision.camera.frame.w,
          frameHeight = vision.camera.frame.h;
      var transform = `matrix(${vision.camera.scale},0,0,${vision.camera.scale},${-vision.camera.x*vision.camera.scale+frameWidth},${-vision.camera.y*vision.camera.scale+frameHeight})`;
      vision.elements.camera.style.transform=transform;
      vision.elements.mediaCamera.style.transform=transform;
      return transform;
    },
    spacePositionFromFrame:function(frameX,frameY){
      return {
        x: vision.camera.x + frameX / ( vision.camera.s * vision.camera.innerScaleRatio ),
        y: vision.camera.y + frameY / ( vision.camera.s * vision.camera.innerScaleRatio )
      }
    },
    spacePositionFromBord:function(bordX,bordY){
      return {
        x: vision.camera.x + bordX / vision.camera.s ,
        y: vision.camera.y + bordY / vision.camera.s 
      }
    },
    spacePositionFromClient:function(clientX,clientY){
      return vision.camera.spacePosition = vision.camera.spacePositionFromFrame(
        clientX - vision.camera.frame.w - vision.camera.frame.left,
        clientY - vision.camera.frame.h - vision.camera.frame.top
      )
    },
    framePositionFromSpace:function(spaceX,spaceY){
      return {
        x: ( vision.camera.s * vision.camera.innerScaleRatio ) * ( spaceX - vision.camera.x ),
        y: ( vision.camera.s * vision.camera.innerScaleRatio ) * ( spaceY - vision.camera.y )
      }
    },

    transformSpacePositionFromFrame:function(x,y,s,frameX,frameY){
      return {
        x: x + frameX / ( s * vision.camera.innerScaleRatio ),
        y: y + frameY / ( s * vision.camera.innerScaleRatio )
      }
    },

    transformFramePositionFromSpace:function(x,y,s,spaceX,spaceY){
      return {
        x: ( s * vision.camera.innerScaleRatio ) * ( spaceX - x ),
        y: ( s * vision.camera.innerScaleRatio ) * ( spaceY - y )
      }
    },
    
    /** test position on space */
    testPosition: function(x,y,s,px,py){
      return {
        x: -x + px / s ,
        y: -y + py / s
      }
    },
    // Test Delta Position For Zoom In or Zoom Out, For FrameX and FrameY
    testDeltaWhenZoomFromFrame: function(s,k,frameX,frameY){
      return {
        x: frameX * (1-k) / ( s * k ) ,
        y: frameY * (1-k) / ( s * k ) ,
      }
    },
    // Test Delta Position For Zoom In or Zoom Out, For SpaceX and SpaceY
    testDeltaWhenZoomFromSpace: function(s,k,spaceX,spaceY){
      return {
        x: spaceX * (1-k) / ( s * k ) ,
        y: spaceY * (1-k) / ( s * k ) ,
      }
    },
    

    /*
      k=> 1.25, 0.80
    */
    zoomTo: function(k=1,frameX=0,frameY=0) {
      var first = vision.camera.spacePositionFromFrame(frameX,frameY);
      //vision.camera.s *= k;
      var last = vision.camera.spacePositionFromFrame(frameX,frameY);
      vision.camera.x += (last.x-first.x);
      vision.camera.y += (last.y-first.y);
      // Success
      vision.camera.x -= frameX * (1-k) / ( vision.camera.s * vision.camera.innerScaleRatio * k );
      vision.camera.y -= frameY * (1-k) / ( vision.camera.s * vision.camera.innerScaleRatio * k );
      vision.camera.s *= k;

      vision.camera.render();
    },
    zoomIn: function(k=1,frameX=0,frameY=0){
      vision.camera.zoomTo( 1 + vision.camera.stepScale * k, frameX, frameY);
      vision.bord.emit("focus",{x:vision.camera.x,y:vision.camera.y,s:vision.camera.s},100);
    },
    zoomOut: function(k=1,frameX=0,frameY=0){
      vision.camera.zoomTo(1 / ( 1 + vision.camera.stepScale * k ), frameX, frameY);
      vision.bord.emit("focus",{x:vision.camera.x,y:vision.camera.y,s:vision.camera.s},100);
    },
    zoomLerp: function(startX,startY,startS,endX,endY,endS,t){
      // Logaritmic interpolation
      if(startS>endS){
        t = 1-t;
        var tmp = endX;
        endX = startX;
        startX = tmp;
        tmp = endY;
        endY = startY;
        startY = tmp;
        tmp = endS;
        endS = startS;
        startS = tmp;
      }
      var s = LerpLogaritmic(startS,endS,t);


      let k = s / startS;
      
      let framePosition = vision.camera.transformFramePositionFromSpace(startX,startY,startS,endX,endY);

      vision.camera.s = s;
      //vision.camera.x = startX - framePosition.x * (1-k) / ( startS * vision.camera.innerScaleRatio * k )// + x;
      //vision.camera.y = startY - framePosition.y * (1-k) / ( startS * vision.camera.innerScaleRatio * k )// + y;
      vision.camera.x = startX - framePosition.x * (1-k) / ( startS * vision.camera.innerScaleRatio * k )// + x;
      vision.camera.y = startY - framePosition.y * (1-k) / ( startS * vision.camera.innerScaleRatio * k )// + y;

      vision.camera.x = Lerp(vision.camera.x, endX, t);
      vision.camera.y = Lerp(vision.camera.y, endY, t);

      vision.camera.render();
    },
    focusList:[],
    focusCancel:function(){
      vision.camera.focusList.forEach(e=>e.cancel());
    },
    willChange:function(value){
      return;
      vision.elements.camera.style.willChange      = value;
      vision.elements.mediaCamera.style.willChange = value;
    },
    focus: function(x,y,s,time,isOwner=true){
      vision.camera.focusCancel();
      if(isOwner){
        vision.bord.emit("focus",{x,y,s},time);
      }
      let startX = vision.camera.x,
        startY = vision.camera.y,
        startS = vision.camera.s,
        targetX = x,
        targetY = y,
        targetS = s;
      vision.camera.willChange("transform");
      // TODO : Cancel previous animation
      let startTime = new Date().getTime();
      function easeInOutCubic(x){
        return 1 - (1 - x) * (1 - x);
      } 
      let focusEnabled = true;
      let focusItem = {
        cancel: function(){
          focusEnabled = false;
        }
      }
      vision.camera.focusList.push(focusItem);
      function animation() {
        let now = new Date().getTime();
        let elapsed = now - startTime;
        let progress = elapsed / (time);
        if(progress > 1 || !focusEnabled){
          progress = 1;
          vision.camera.focusList.splice(vision.camera.focusList.indexOf(focusItem),1);
          vision.camera.willChange(null);
        }else{
          requestAnimationFrame(animation);
        }
        vision.camera.zoomLerp(startX,startY,startS,targetX,targetY,targetS,easeInOutCubic(progress));
      }
      animation();
    },
    get matrix(){
      //return Matrix.fromElement(vision.elements.camera);
      return new Matrix([this.s,0,0,this.s,this.x,this.y]);
    },
    /** @return {Bound} */
    bound:function(x=null,y=null,s=null){
      if(s==null) s = this.s;
      if(x==null) x = this.x;
      if(y==null) y = this.y;

      let w = 0.5 * this.size.width  / (s) ;
      let h = 0.5 * this.size.height / (s) ;
      return {
        x: x,
        y: y,
        w: w,
        h: h,
        width: w*2,
        height: h*2,
        left: x - w,
        right: x + w,
        top: y - h,
        bottom: y + h
      }
    }
  }

  

  // OnResize
  window.addEventListener("resize",function(){ vision.camera.resize(); })

  // Disable ContextMenu
  window.addEventListener("contextmenu",function(e){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false
  })
   // Disable ContextMenu
   document.addEventListener("contextmenu",function(e){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false
  })
  
  vision._disabled=false;
  Object.defineProperty(vision,"disabled",{
    get: ()=>vision._disabled,
    set: (value)=>{
      vision.pointerEvents=[]
      vision._disabled = value;
      if(value==false){
        vision.elements.medias.style.zIndex=""
      }else{
        vision.elements.medias.style.zIndex=3
      }
    }
  });


  // On Pointer Move
  vision.render = function(){
    vision.camera.render();
  }
  
  
  
  //@test
  vision.log = function(){
    //let areaPosition = vision.camera.areaPositionFromClient(vision.log.x,vision.log.y)
    let spacePositionFromFrame  = vision.camera.spacePositionFromFrame(vision.camera.framePosition.x,vision.camera.framePosition.y)
    //let spacePositionFromArea = vision.camera.spacePositionFromArea(areaPosition.x,areaPosition.y)
    let frameFromSpace = vision.camera.framePositionFromSpace(spacePositionFromFrame.x,spacePositionFromFrame.y)
    vision.elements.debug.innerText = JSON.stringify({
      client:{x:vision.log.x,y:vision.log.y},
      framePosition: vision.camera.framePosition,
      bordPosition:vision.camera.bordPosition,
      spaceFromFrame:spacePositionFromFrame ,
      //areaFromClient: areaPosition,
      //spaceFromArea:spacePositionFromArea,
      "CHECK":"--------",
      frameFromSpace:frameFromSpace,
      spaceFromBord:vision.camera.spacePositionFromBord(vision.camera.bordPosition.x,vision.camera.bordPosition.y),
      spaceFromClient:vision.camera.spacePositionFromClient(vision.log.x,vision.log.y),
      pointers: vision.pointers.map(e=>({x:e.x,y:e.y,id:e.pointerId})),
      x: vision.camera.x,
      y: vision.camera.y,
      s: vision.camera.s,
      //camera: vision.camera
    },"\n",2);
  }

  vision.log.rectangle = function(left,top,right,bottom){
    let rect = Bord.Vision.Shapes.Create("rect",{"x":-0.5,"y":-0.5,"width":1,"height":1,"stroke-width":2,"stroke":"#ff5500","fill":"transparent","vector-effect":"non-scaling-stroke"});
    var w = right - left;
    var h = bottom - top;
    var x = left + w / 2;
    var y = top + h / 2;
    var matrix = [w,0,0,h,x,y];
    console.log(matrix)
    rect.style.transform = `matrix( ${matrix.join(',')} )`;
    vision.elements.camera.appendChild(rect);
    setTimeout(()=>{
      vision.elements.camera.removeChild(rect);
    },2000)
  }

  vision.log.line = function(left,top,right,bottom){
    let line = Bord.Vision.Shapes.Create("line",{"x1":"0","y1":"0","x2":"1","y2":"0","stroke-width":2,"stroke":"#ff5500","fill":"transparent","vector-effect":"non-scaling-stroke"});
    var matrix = new Matrix([1,0,0,1,left,top])
    var distance = Math.sqrt( (right-left)**2 + (bottom-top)**2 )
    var angle = Math.atan2(bottom-top,right-left)
    var scale = distance
    matrix.rotateLocal(angle,{x:0,y:0})
    matrix.scaleLocal(scale,{x:0,y:0})
    
    line.style.transform = `matrix(${matrix.values.join(",")})`;
    vision.elements.camera.appendChild(line);
    setTimeout(()=>{
      vision.elements.camera.removeChild(line);
    },2000)
  }

  vision.elements.frame.addEventListener("dblclick",function(){
    vision.elements.debug.style.display = vision.elements.debug.style.display=="block" ? "none" : "block";
  });

  //@endtest

  window.addEventListener("pointermove",function(e){
    vision.camera.framePositionFromClient(e.clientX,e.clientY)
    vision.camera.bordPositionFromClient(e.clientX,e.clientY)
    vision.camera.spacePositionFromClient(e.clientX,e.clientY)

    //@test 
    vision.log.x = e.clientX;
    vision.log.y = e.clientY;
    vision.log();
    //@endtest 

  })

  //===== Variables & Configurations ========
  /**
   * Modes : 
   *   "single" : One Hand draw, Two Hand Zoom
   *   "multi"  : All Hand draw
   *   "camera" : Move & Zoom Camera Only
   *   "pen"    : pencil with drawing, Camera with touch
   */
  vision.mode = "single";



  //=========  Pointer Events  ==============
  /*
   PointerAny  : points : [{x,y},...]
   PointerDown : points : [{x,y},...]
   PointerMove : points : [{x,y},...]
   PointerUp   : points : [{x,y},...]
   PointerThen : points : [{x,y},...]
  */
  
  vision.pointers = [];
  vision.action = null
  vision.downPointers = []

  //-- IsEventOnButton --/
  /** @param {Array< PointerEvent >} e */
  function IsEventOnButton(e){

  }


  //---------- IsOnSelectRectangle ---------------
  vision.isOnSelectRectangle = false;
  function IsOnSelectRectangle(e) {
    if(vision.selectRectangleElement==null) return false
    if(e.length==0) return false
    for(let i=0;i<e.length;i++){
      let p = e[i]
      if( document.elementsFromPoint(p.clientX,p.clientY).indexOf(vision.selectRectangleElement)==-1 ) return false;
    }
    return true
  }  

  //---------- IsPointerLongTime -----------------
  function IsPointerLongTime(e){
    if(e.length==0) return false;
    let p = e[0]
    let pid = p.pointerId;
    // Must be mode "single"
    if(vision.mode != "single") return false;
    // Must be touch
    if(p.pointerType != "touch") return false;
    // Must be action "draw"
    if(vision.action != "draw") return false;
    // Must be long time
    if(p.timeStamp - vision.downPointers[0].timeStamp < 500) return false;
    // All pointers in 0.025 distance
    let firstPoint = vision.bordPoints[pid][0];
    if(firstPoint==null) return false;
    for(var i=0;i<vision.bordPoints[pid].length;i++){
      let b = vision.bordPoints[pid][i];
      if( Math.abs(b.x-firstPoint.x) > vision.camera.frame.width*0.015 || Math.abs(b.y-firstPoint.y) > vision.camera.frame.height*0.015 ){
        return false;
      }
    }
    return true
  }

  vision.maxPointerCount = 0;
  vision.lastMaxPointerCount = 0;
  vision.lastPointerLength = 0;
  vision.lastAction = null;
  /** @param {Array< PointerEvent >} e */
  function PointerAny(e,type){
    if(vision.selectRectangleElement!=null && vision.selectRectangleElement.parentElement!=null && e.every(e=>e.type=="pointermove" && e.button==0)){
      RecolorSelectRectangleDrags(e)
    }
    // Virtualize Here
    // TODO: When Scale See Here

    if(e.length==0) return false;
    // Button Click Exit
    let noAction = false;
    for(let i=0;i<e.length;i++){
      let elements = document.elementsFromPoint(e[i].clientX,e[i].clientY);
      if(elements.some(item=>item.classList.contains("bord--button--round") || item.classList.contains("no-action"))){
        noAction = true;
        break;
      }
    }
    
    if(noAction && e.some(e=>e.type=="pointerdown")){
      vision.action = "wait" 
      return false;
    }

    if(e.length>0 && e.some(e=>e.composedPath && e.composedPath())){
      if(e.length>0 && e.some(e=>e.type=="pointerdown")  && noAction ){
        vision.action="wait"
        return false;
      }else if(vision.action=="wait" && type!="pointerup" && noAction==false ){
        vision.action=null
      }
    }
    // console.log("PointerAny",e,type)

    vision.pointers = e
    if(vision.action!="wait"){
      PointsRecord(e)
    }
    // maxPointerCount
    if(e.length>vision.maxPointerCount) vision.maxPointerCount = e.length


    //# Pen Mode
    // TODO: Long Time Select Action
    if(vision.mode=="pen" && e.length>0){
      if(e[0].type=="pointerdown"){
        vision.downPointers = e
      }
      
      if(e[0].pointerType=="pen"){
        vision.action = "draw"
      }
      
      if( vision.action!="draw" && (e[0].pointerType=="touch" || e[0].pointerType=="mouse") ){
        vision.action="pan"
        CameraActions(e)
      }
      
      if(vision.action=="draw"){
        console.log("actiondraw call")
        ActionDraw(e)
      }
      if(e.length==1 && e[0].type=="pointerup"){
        vision.downPointers = []
        vision.action = null
      }
    }
  }

  /** @param {Array< PointerEvent >} e */
  function PointerThen(e) {
    // reset maxPointerCount
    if (e.length==1 && e[0].type=="pointerup") vision.maxPointerCount = 0
    // maxPointerCountLast
    vision.lastMaxPointerCount = vision.maxPointerCount
    // pointerLength
    vision.lastPointerLength = e.length
  }

  // TODO : Think 
  function PointerRing(){

  }

  //---------- PointerDown ---------------
  /** @param {Array< PointerEvent >} e */
  function PointerDown(e){
    if(vision.action=="wait") return;
    if(vision.disabled==true) return;

    vision.downPointers = e
    
    //# Multi Mode
    if(vision.mode == "multi"){
      ActionDraw(e)
    }
    //# Single Mode
    if(vision.mode == "single" ){
      // StartDrag
      if( (vision.isOnSelectRectangle=IsOnSelectRectangle(e)) && e.every(e=>e.buttons&1) ){
        vision.action="drag"
        ActionDrag(e);
      }
      // Shift Select & Right Click Select
      if( (e.length==1 && e[0].shiftKey) || (e.length==1 && e[0].pointerType=="mouse" && e[0].buttons&2 )  ){
        vision.action="select"
        ActionSelect(e);
      }
      // Two Finger Pan & Ctrl + Pan & Middle Mouse Button Drag
      if( (vision.isOnSelectRectangle==false && e.length==2) || (e.length==1 && e[0].ctrlKey) || (e.length==1 && e[0].pointerType=="mouse" && e[0].buttons&4) ){
        vision.action="pan"
        ActionDrawCancel(e)
        if(vision.selectRectangleElement==null)
          ActionSelectCancel(e)
      }
      // ActionDraw
      if(e.length==1 && vision.action==null && vision.lastAction!="select" && vision.lastAction!="drag" ){
        vision.action="draw"
        ActionDraw(e)
      }
    }

    CameraCache(true)
  }

  //---------- PointerMove -----------------
  /** @param {Array< PointerEvent >} e */
  function PointerMove(e){
    if(vision.action=="wait") return;
    if(vision.disabled==true) return;

    //# Multi Mode
    if(vision.mode == "multi"){
      ActionDraw(e)
    }
    //console.log("PointerMove",e,vision.action)


    //# Single Mode
    if(vision.mode == "single" ){
      // Is Pointer Long Time
      if(IsPointerLongTime(e)){
        vision.action = "select"
        ActionDrawCancel(e)
      }

      if(vision.action == "select"){
        ActionSelect(e)
      }
      
      if(vision.action == "drag"){
        ActionDrag(e)
      }

      if(vision.action=="draw"){
        ActionDraw(e)
        ActionSelectCancel(e)
      }
      // Camera Move & Scale & Rotate ( Frame )
      if(vision.action=="pan" /* && vision.isOnSelectRectangle==false */){
        CameraActions(e)
      }
      // Drag Move & Scale & Rotate ( Item )
      if( vision.action=="drag" && vision.isOnSelectRectangle==true ){
        ActionDrag(e)
      }
    }
    
    //# Camera Mode
    if(vision.mode == "camera"){
      CameraActions(e)
    }  

  }

  //---------- PointerUp ---------------
  /** @param {Array< PointerEvent >} e */
  function PointerUp(e){
    if(vision.action=="wait") return;
    if(vision.disabled==true) return;
    
    //# Multi Mode
    if(vision.mode == "multi"){
      ActionDraw(e)
    }

    //# Single Mode
    if(vision.mode == "single" ){
      
      if(vision.action == "select"){
        ActionSelect(e)
      }
      
      if(vision.action == "drag"){
        ActionDrag(e)
      }

      // Drawing
      if(vision.action=="draw"){
        ActionDraw(e)
      }

      // OneClick Select Cancel
      if(vision.downPointers.length==1 && vision.bordPoints[e[0].pointerId].length==2){
        ActionSelectCancel(e)
      }
      
      if(vision.action==null){
        ActionSelectCancel(e)
      }

    }

    //# Camera Mode
    if(vision.mode == "camera"){
      CameraActions(e)
    }

    // Remove Pointers 
    for(let i=0;i<e.length;i++){
      let p = e[i]
      let pid=p.pointerId
      if(p.type=="pointerup"){
        delete vision.spacePoints[pid]
        delete vision.framePoints[pid]
        delete vision.bordPoints[pid]
        vision.downPointers = vision.downPointers.filter(p=>p.pointerId!=e.pid)
      }
    }
    
    vision.camera_cache = null;
    vision.lastAction = vision.action;
    if(e.length==1 && e[0].type=="pointerup") vision.action = null
    vision.downPointers = e.filter(e=>e.type!="pointerup")
  }

  Bord.Vision.PointerEvents(vision,PointerAny,PointerDown,PointerMove,PointerUp,PointerThen)


  // TODO: Layers
  /**
   * Space Layers : 
   * Display Layers :
   */
  vision.layers = [];


  //================ Drawing ==================
  
  /*
    Points : 
    [
      [{x,y},{x,y}], // Pointer ID 1 Point List
      [{x,y},{x,y}], // Pointer ID 2 Point List
      [{x,y},{x,y}], // Pointer ID 3 Point List
      ....
    ]
  */
  vision.framePoints = {}; 
  vision.bordPoints = {};
  vision.spacePoints = {};

  /** @type {number:SVGPolylineElement|SVGPathElement} vision.temp */
  vision.temp = {}

  //------------ PointsRecord ----------------
  function PointsRecord(e) {
    for(let i=0;i<e.length;i++){
      let p = e[i];
      let pid = p.pointerId;

      if(vision.framePoints[pid]==undefined) vision.framePoints[pid]=[]
      if(vision.bordPoints[pid]==undefined) vision.bordPoints[pid]=[]
      if(vision.spacePoints[pid]==undefined) vision.spacePoints[pid]=[]

      let framePoint  = vision.camera.framePositionFromClient(p.clientX,p.clientY)
      let bordPoint = vision.camera.bordPositionFromClient(p.clientX,p.clientY)
      let spacePoint = vision.camera.spacePositionFromFrame( framePoint.x, framePoint.y )
      
      vision.framePoints[pid].push(framePoint)
      vision.bordPoints[pid].push(bordPoint)
      vision.spacePoints[pid].push(spacePoint)
    }
  }

  //------------- ActionDraw ----------------
  /** @param {Array< PointerEvent >} e */
  function ActionDraw(e){


    for(let i=0;i<e.length;i++){
      let p = e[i]
      let pid = p.pointerId
      //console.log(p)
      if(p.type=="pointerdown"){
        vision.temp[pid] = Bord.Vision.Shapes.Create("polyline",{"color":vision.color.value,"style":"stroke-width:"+vision.stroke.value+"px"})
        vision.elements.bordCamera.append(vision.temp[pid])
      }
      vision.temp[pid].setAttribute("points",vision.bordPoints[pid].map(e=>int(e.x)+","+int(e.y)).join(" ") )

      console.log(i,p.type,p.pointerId)
      if(p.type=="pointerup"){
        // TODO HACK : Dots not removing
        if(vision.temp[pid].parentElement != null && vision.temp[pid]){
          vision.temp[pid].parentElement.removeChild(vision.temp[pid]);
          delete vision.temp[pid];
        } 
        // TODO: ElementAdd( {t:p,.....} )
        // TODO: Adding If point length == 1 circle 
        if(vision.framePoints[pid].length<3) continue;
        vision.temp[pid] = Bord.Vision.Shapes.Create("path",{"color":vision.color.value,"style":"stroke-width:"+vision.stroke.get()+"px"})
        let spacePoints = vision.spacePoints[pid]

        /** @type {number[][]} */
        var points = fitCurve(vision.framePoints[pid].map(e=>[e.x*10,e.y*10]), 100);
        // TODO: Adding If point length == 1 circle 
        if(points.length==0) continue;
        points = points.map(e=> e.map(p=>vision.camera.spacePositionFromFrame(p[0]/10,p[1]/10)) )
        
        
        // Normalize Points
        let {p,m,b} = Bord.Vision.Transform.Normalize( Bord.Vision.Transform.ArrayJoin(points) ,1000,true)
        p = Bord.Vision.Transform.ArraySplit(p,4)
        p = p.map(e=>e.map(e=>([parseInt(e.x),parseInt(e.y)]) ))
        console.log(p,m,b)

        // Calculate transform
        vision.temp[pid].setAttribute("d", Bord.Vision.Transform.PointsToPathData(p) )
        vision.temp[pid].style.transform = "matrix("+m.join(",")+")"
        vision.temp[pid].style.strokeWidth = vision.stroke.get() /  m[0] // Math.sqrt(m[0]**2+m[3]**2) 
        vision.elements.camera.append(vision.temp[pid])
        

        // Vertices Points (vertices:v)
        let vertices = [ [p[0][0]], ...p.map(e=>[ Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.5) ,e[3]]) ]
        vertices = vertices.map(e=>e.join(",")).join(",").split(",").map(e=>float(e))

        let vertices4 = [ [p[0][0]], ...p.map(e=>[ 
          //Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.1),
          Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.2),
          //Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.3),
          Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.4),
          //Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.5),
          Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.6),
          //Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.7),
          Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.8),
          //Bord.Vision.Transform.CubicBezierPoint(e[0],e[1],e[2],e[3],0.9),
          e[3]]) ]
        vertices4 = vertices4.map(e=>e.join(",")).join(",").split(",").map(e=>float(e))
        
        /*
        vertices = Bord.Vision.Transform.ArrayJoin(
        Bord.Vision.Transform.ArraySplit(vertices,2).map(e=>{
          var p = Matrix.getLocalPoint(m,{x:e[0],y:e[1]})
          return [p.x,p.y]
        }) )
        */
        // Transform Matrix (transform:t)
        //--------- NEW DRAWING ---------//
        vision.temp[pid].data={
          p:p,
          m:m,
          b:b,
          v:vertices,
        }
        vision.temp[pid].v4 = vertices4
        vision.defineId(vision.temp[pid])
        vision.bord.emit("drawingAdd", vision.drawingSave( vision.temp[pid] ) )

        delete vision.temp[pid]
        console.log(vertices)
        continue;
        
        let debug_temp = Bord.Vision.Shapes.Create("polyline",{"stroke":"red","style":"stroke-width:"+vision.stroke.value+"px"})
        debug_temp.setAttribute("points",vertices.join(","))
        debug_temp.style.transform = "matrix("+m.join(",")+")"
        vision.elements.camera.append(debug_temp)
        setTimeout(()=>{
          debug_temp.remove()
        },2000) 
      }
    } 
  }

  //------------- ActionDrawCancel ----------------
  /** @param {Array< PointerEvent >} e */
  function ActionDrawCancel(e) {
    for(let i=0;i<e.length;i++){
      let p = e[i]
      let pid = p.pointerId
      // Remove Element From Parent
      if( vision.temp[pid] && vision.temp[pid].parentElement !=  null && vision.temp[pid]) vision.temp[pid].parentElement.removeChild(vision.temp[pid])
      vision.temp[pid]=null
    }
  }


  //====    Select & Move & Rotate & Scale    ====

  //------------ ActionSelect ----------------
  /** @type {BordSelectElement} */
  vision.selectRectangleElement = null;
  /** @param {Array< PointerEvent >} e */
  function ActionSelect(e){
    let p = e[0]

    vision.selectRectangleElement?.rightTop?.remove()
    vision.selectRectangleElement?.rightBottom?.remove()
    if(vision.selectRectangleElement == null){
      vision.selectRectangleElement = Bord.Vision.Shapes.Create("rect",{
        "class":"select-rectangle",
        "x":"-1000",
        "y":"-1000",
        "width":"2000",
        "height":"2000",
      })
      vision.elements.camera.append(vision.selectRectangleElement)
      vision.selectRectangleElement.dontSave = true
    }

    let left = Math.min(p.clientX,vision.downPointers[0].clientX)
    let top = Math.min(p.clientY,vision.downPointers[0].clientY)
    let width = Math.abs(p.clientX-vision.downPointers[0].clientX)
    let height = Math.abs(p.clientY-vision.downPointers[0].clientY)
    
    let center = {x:left+width/2,y:top+height/2}
    let spaceCenter = vision.camera.spacePositionFromClient(center.x,center.y)
    let spaceStart = vision.camera.spacePositionFromClient(left,top)
    let spaceEnd = vision.camera.spacePositionFromClient(left+width,top+height)
    let spaceSize = {x:(spaceEnd.x-spaceStart.x)/2000,y:(spaceEnd.y-spaceStart.y)/2000}
    
    vision.selectRectangleElement.spaceBound = {
      x:spaceCenter.x,
      y:spaceCenter.y,
      w:spaceSize.x,
      h:spaceSize.y,
      left : spaceStart.x,
      top : spaceStart.y,
      right : spaceEnd.x,
      bottom : spaceEnd.y,
      width : spaceSize.x*2,
      height : spaceSize.y*2,
    }
    var spaceBound  = vision.selectRectangleElement.spaceBound
    vision.selectRectangleElement.style.transform = `matrix(${spaceBound.w},0,0,${spaceBound.h},${spaceBound.x},${spaceBound.y})`
    vision.selectRectangleElement.data = {}
    vision.selectRectangleElement.data.m = [spaceBound.w.x,0,0,spaceBound.h,spaceBound.x,spaceBound.y]
    if(p.type=="pointerup"){
      FindSelectedItems()
      ShowSelectRectangleDrags()
    }
  }

  //-------- ActionSelectCancel ----------------
  function ActionSelectCancel(e){
    console.trace("ActionSelectCancel")
    if(vision.selectRectangleElement != null){
      vision.selectRectangleElement?.rightTop?.remove()
      vision.selectRectangleElement?.rightBottom?.remove()
      vision.selectRectangleElement?.remove()
      vision.selectRectangleElement = null
    }
    DeselectItems()
  }

  //--------- FindSelectedItems -----------------
  /** @type {(HTMLElement|SVGElement)[]} */
  vision.selectedItems = [];
  /** @type {(SVGElement)[]} */
  vision.selectedDrawings = [];
  /** @type {(HTMLElement)[]} */
  vision.selectedMedias = [];
  function FindSelectedItems() {
    DeselectItems()
    let spaceBound = vision.selectRectangleElement.spaceBound
    vision.selectedDrawings = Array.from(vision.elements.camera.children)
    .filter(e=>["PATH","IMAGE"].indexOf(e.tagName.toUpperCase())>-1 )
    .filter(e=>{
      if(e.tagName.toUpperCase()=="PATH"){
        return Bord.Vision.Transform.SelectDrawing(e,spaceBound,1000)
      }
    })

    vision.selectedMedias = Array.from(vision.elements.mediaCamera.children)
    .filter(e=>["IMG","DIV"].indexOf(e.tagName.toUpperCase())>-1 )
    .filter(e=>{
      return Bord.Vision.Transform.SelectMedia(e,spaceBound,true)
    });
    
    vision.selectedItems = vision.selectedDrawings.concat(vision.selectedMedias)
    
    vision.selectedItems.forEach(e=>{e.classList.add("selected");e.style.transition=null})
    SelectRectangleResize()
    console.log("Selected Drawings:",vision.selectedItems)
  }

  //--------- findItemsInBound  -----------------//
  /** @param {Rectangle} bound */
  vision.findItemsInBound = function(bound,forceMedia=false){
    let drawings = Array.from(vision.elements.camera.children)
    .filter(e=>["PATH","IMAGE"].indexOf(e.tagName.toUpperCase())>-1 )
    .filter(e=>{
      if(e.tagName.toUpperCase()=="PATH"){
        return Bord.Vision.Transform.SelectDrawing(e,bound,1000)
      }
    })
    
    let medias = Array.from(vision.elements.mediaCamera.children)
    .filter(e=>["IMG","DIV"].indexOf(e.tagName.toUpperCase())>-1 )
    .filter(e=>{
      return Bord.Vision.Transform.SelectMedia(e,bound,forceMedia)
    });

    let items = drawings.concat(medias)

    return {drawings,medias,items}
  }

  //--------- SelectRectangleResize ---------//
  /** Calc selected elements size. Resize selectedRectangle */
  function SelectRectangleResize() {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    vision.selectedItems.forEach(e=>{
      var matrix = new Matrix(e.data.m)
      for(let i=0;i<e.data.v.length;i+=2){
        let p = matrix.getGlobalPoint({x:e.data.v[i],y:e.data.v[i+1]})
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
    })
    minX = Math.min(minX, vision.selectRectangleElement.spaceBound.left)
    minY = Math.min(minY, vision.selectRectangleElement.spaceBound.top)
    maxX = Math.max(maxX, vision.selectRectangleElement.spaceBound.right)
    maxY = Math.max(maxY, vision.selectRectangleElement.spaceBound.bottom)
    vision.selectRectangleElement.spaceBound = {
      x:(minX+maxX)/2,
      y:(minY+maxY)/2,
      w:(maxX-minX)/2000,
      h:(maxY-minY)/2000,
      left : minX,
      top : minY,
      right : maxX,
      bottom : maxY,
      width  : (maxX-minX)/1000,
      height : (maxY-minY)/1000,
    }
    var spaceBound  = vision.selectRectangleElement.spaceBound
    console.log("spaceBound",spaceBound)
    vision.selectRectangleElement.style.transform = `matrix(${spaceBound.w},0,0,${spaceBound.h},${spaceBound.x},${spaceBound.y})`
    vision.selectRectangleElement.data.m = [spaceBound.w,0,0,spaceBound.h,spaceBound.x,spaceBound.y]
  }

  //-- On Desktop Show Rectangle Sizes --//
  function ShowSelectRectangleDrags(){
    let rightBottom = Asena(`<path xmlns="http://www.w3.org/2000/svg" d="M10,5 L10,10 L5,10 M10,10 L2,2" style="fill: none;stroke:var(--color-1);stroke-width:0.5px"></path>`)
    var matrix = new Matrix([... vision.selectRectangleElement.data.m ],rightBottom)
    matrix.moveLocal({x:1000,y:1000})
    var minSize = matrix.width() < matrix.height() ? matrix.width() : matrix.height()
    matrix.setWidth(minSize)
    matrix.setHeight(minSize)
    matrix.scaleLocal(50,{x:0,y:0})
    matrix.moveLocal({x:-14,y:-14})
    vision.elements.camera.appendChild(rightBottom)
    vision.selectRectangleElement.rightBottom = rightBottom
    rightBottom.data = { m : [...matrix.values] }
    rightBottom.dontSave = true

    let rightTop = Asena(`<path xmlns="http://www.w3.org/2000/svg" d="M10,0 Q10,-10 0,-10 L2,-12 M0,-10 L2,-8" style="fill: none;stroke:var(--color-1);stroke-width:0.5px"></path>`)
    matrix = new Matrix([... vision.selectRectangleElement.data.m ],rightTop)
    matrix.moveLocal({x:1000,y:-1000})
    matrix.setWidth(minSize)
    matrix.setHeight(minSize)
    matrix.scaleLocal(50,{x:0,y:0})
    matrix.moveLocal({x:-14,y:14})
    vision.elements.camera.appendChild(rightTop)
    vision.selectRectangleElement.rightTop = rightTop
    rightTop.data = { m : [...matrix.values] }
    rightTop.dontSave = true
  }

  //-- On Desktop Recolor Select Rectangle Sizes --//
  /**  */
  function RecolorSelectRectangleDrags(e){
    let _near_ = 300;
    let p = e[0];
    let matrix = Matrix.fromElement(vision.selectRectangleElement)
    vision.camera.spacePosition = vision.camera.spacePositionFromBord(vision.camera.bordPosition.x,vision.camera.bordPosition.y)
    let localPosition = matrix.getLocalPoint(vision.camera.spacePosition)
    vision.selectRectangleElement.dragType = "none"
    if(!localPosition) return

    if(!vision.selectRectangleElement.rightBottom) return
    var rightBottomLocalPosition = Matrix.fromElement(vision.selectRectangleElement.rightBottom).getLocalPoint(vision.camera.spacePosition)
    if( Math.abs(rightBottomLocalPosition.x-7)<7 && Math.abs(rightBottomLocalPosition.y-7)<7 ){
      vision.selectRectangleElement.dragType = "scale"
      vision.selectRectangleElement.rightBottom.style.stroke = "var(--color-5)"
    }else{
      vision.selectRectangleElement.rightBottom.style.stroke = "var(--color-1)"
    }

    if(!vision.selectRectangleElement.rightTop) return
    var rightTopLocalPosition = Matrix.fromElement(vision.selectRectangleElement.rightTop).getLocalPoint(vision.camera.spacePosition)
    if( Math.abs(rightTopLocalPosition.x-7)<7 && Math.abs(rightTopLocalPosition.y+7)<7 ){
      vision.selectRectangleElement.dragType = "rotate"
      vision.selectRectangleElement.rightTop.style.stroke = "var(--color-5)"
    }else{
      vision.selectRectangleElement.rightTop.style.stroke = "var(--color-1)"
    }
  }

  //-- DeselectItems --//
  function DeselectItems() {
    vision.selectedItems.forEach(e=>e.classList.remove("selected"))
    vision.selectedItems = []
  }


  //-------- ActionDrag -------------------------
  /** @param {Array< PointerEvent >} e */
  function ActionDrag(e){
    if(e.length==1 && e[0].type=="pointerdown"){
      RecolorSelectRectangleDrags(e)
    }
    if(e.length!=vision.lastPointerLength ){
      vision.selectedItems.forEach(e=>{
        e.data.m = e.matrix.values
      })
      vision.selectRectangleElement.data.m = vision.selectRectangleElement.matrix.values
      vision.selectRectangleElement.rightTop.data.m = vision.selectRectangleElement.rightTop.matrix.values
      vision.selectRectangleElement.rightBottom.data.m = vision.selectRectangleElement.rightBottom.matrix.values
      vision.downPointers=e
    }
    // Scale Zoom
    if(e.length==2){
      ActionDragScaleZoom(e)
    }else if(e.length==1){
      // Moving
      ActionDragMove(e)
    }
    if(e.every(e=>e.type=="pointerup")){
      var selectedItems = vision.selectedItems
      var data = selectedItems.map(e=>({hash:e.data.user+"."+e.data.id,m:e.data.m}))
      vision.bord.emit("dragend",data)
    }
  }
  //-------- ActionDragSaveSelectedElements ----------------------
  function ActionDragSaveSelectedElements() {
    
  }

  //-------- ActionDragMove ----------------------
  /** @param {Array< PointerEvent >} event */
  function ActionDragMove(event) {
    var down1 = vision.camera.spacePositionFromClient(vision.downPointers[0].clientX,vision.downPointers[0].clientY)
    var now1 = vision.camera.spacePositionFromClient(event[0].clientX,event[0].clientY)
    var center = {
      x:vision.selectRectangleElement.data.m[4],
      y:vision.selectRectangleElement.data.m[5]
    }
    

    let allElements = [...vision.selectedItems, vision.selectRectangleElement,vision.selectRectangleElement.rightTop,vision.selectRectangleElement.rightBottom]
    
    if(vision.selectRectangleElement.dragType=="none"){
      var delta = {x:now1.x-down1.x,y:now1.y-down1.y}
      allElements.forEach(el=>{
        let matrix = new Matrix([...el.data.m],el)
        el.matrix = matrix
        matrix.translateGlobal(delta)
        if(event.some(e=>e.type=="pointerup")){ el.data.m = matrix.values }
      })
    }

    if(vision.selectRectangleElement.dragType=="scale"){
      var delta = Math.sqrt( Math.pow(center.x-now1.x,2) + Math.pow(center.y-now1.y,2) ) / Math.sqrt( Math.pow(center.x-down1.x,2) + Math.pow(center.y-down1.y,2) ) 
      allElements.forEach(el=>{
        let matrix = new Matrix([...el.data.m],el)
        el.matrix = matrix
        matrix.scaleGlobal(delta,center)
        if(event.some(e=>e.type=="pointerup")){ el.data.m = matrix.values }
      })
    }

    if(vision.selectRectangleElement.dragType=="rotate"){
      var delta = Math.atan2(now1.y-center.y,now1.x-center.x) - Math.atan2(down1.y-center.y,down1.x-center.x)
      allElements.forEach(el=>{
        let matrix = new Matrix([...el.data.m],el)
        el.matrix = matrix
        matrix.rotateGlobal(delta,center)
        if(event.some(e=>e.type=="pointerup")){ el.data.m = matrix.values }
      })
    }


    


  }

  //-------- ActionDragScaleZoom -----------------
  /** @param {Array< PointerEvent >} event */
  function ActionDragScaleZoom(event) {
    var down1 = vision.camera.spacePositionFromClient(vision.downPointers[0].clientX,vision.downPointers[0].clientY)
    var down2 = vision.camera.spacePositionFromClient(vision.downPointers[1].clientX,vision.downPointers[1].clientY)
    var now1 = vision.camera.spacePositionFromClient(event[0].clientX,event[0].clientY)
    var now2 = vision.camera.spacePositionFromClient(event[1].clientX,event[1].clientY)
    
    var downCenter = {x:(down1.x+down2.x)/2,y:(down1.y+down2.y)/2}
    var nowCenter = {x:(now1.x+now2.x)/2,y:(now1.y+now2.y)/2}
    var deltaCenter = {x:nowCenter.x-downCenter.x,y:nowCenter.y-downCenter.y}

    var downDistance = Math.sqrt(Math.pow(down1.x-down2.x,2)+Math.pow(down1.y-down2.y,2))
    var nowDistance = Math.sqrt(Math.pow(now1.x-now2.x,2)+Math.pow(now1.y-now2.y,2))
    var distanceScale = nowDistance/downDistance

    var downAngle = Math.atan2(down2.y-down1.y,down2.x-down1.x)
    var nowAngle = Math.atan2(now2.y-now1.y,now2.x-now1.x)
    var rotateAngle = nowAngle-downAngle


    let allElements = [...vision.selectedItems, vision.selectRectangleElement,vision.selectRectangleElement.rightTop,vision.selectRectangleElement.rightBottom]

    allElements.forEach(el=>{
      let matrix = new Matrix([...el.data.m],el)
      el.matrix = matrix
      matrix.translateGlobal(deltaCenter)
      matrix.rotateGlobal(rotateAngle,nowCenter)
      matrix.scaleGlobal(distanceScale,nowCenter)
      if(event.some(e=>e.type=="pointerup")){
        el.data.m = matrix.values
      }
    })


  }

  
  //======= Change Camera Position & Zoom ========
  /**
   * CameraCache
   * CameraActions
   *  CameraMove
   *  CameraZoomScale
   *  Camera Zoom on Mouse Wheel
   */
  function CameraCache(generate=false){
    if(vision.camera_cache == null || generate){
      vision.camera_cache = {
        x:vision.camera.x,
        y:vision.camera.y,
        s:vision.camera.s,
        scale:vision.camera.scale,
      }
    }
  }

  function CameraActions(e) {
    if(vision.downPointers.length==0) return;
    if(e.length==1){
      CameraMove(e)
    }else if(e.length==2){
      CameraMoveScale(e)
    }
    vision.bord.emit("focus",{x:vision.camera.x,y:vision.camera.y,s:vision.camera.s},100);
  }

  //-------------- Camera Move -----------------
  function CameraMove(e) {
    CameraCache()

    let p = e[0]
    let d = vision.downPointers[0]
    let spaceDown = vision.camera.spacePositionFromFrame(d.clientX,d.clientY)
    let spaceMove = vision.camera.spacePositionFromFrame(p.clientX,p.clientY)
    let delta = { 
      x: spaceMove.x - spaceDown.x,
      y: spaceMove.y - spaceDown.y
    }
    
    vision.camera.x = vision.camera_cache.x - delta.x
    vision.camera.y = vision.camera_cache.y - delta.y
    vision.camera.render()
  }

  
  //------- Camera Move Zoom With Two Finger ------------
  _distanceScale = 1
  function CameraMoveScale(e){
    CameraCache()

    let frameDown1 = vision.camera.framePositionFromClient(vision.downPointers[0].clientX,vision.downPointers[0].clientY)
    let frameDown2 = vision.camera.framePositionFromClient(vision.downPointers[1].clientX,vision.downPointers[1].clientY)
    let frameDownCenter = { x: (frameDown1.x + frameDown2.x) / 2 , y: (frameDown1.y + frameDown2.y) / 2 }
    let frameDownDistance = Math.sqrt( (frameDown1.x-frameDown2.x)**2 + (frameDown1.y-frameDown2.y)**2 )

    let frameMove1 = vision.camera.framePositionFromClient(e[0].clientX,e[0].clientY)
    let frameMove2 = vision.camera.framePositionFromClient(e[1].clientX,e[1].clientY)
    let frameMoveCenter = { x: (frameMove1.x + frameMove2.x) / 2 , y: (frameMove1.y + frameMove2.y) / 2 }
    let frameMoveDistance = Math.sqrt( (frameMove1.x-frameMove2.x)**2 + (frameMove1.y-frameMove2.y)**2 )

    let deltaPosition = { x : frameMoveCenter.x - frameDownCenter.x , y: frameMoveCenter.y - frameDownCenter.y  }

    let distanceScale = frameMoveDistance / frameDownDistance;
    // Optimize Zoom
    /*
    if(e.some(e=>e.type=="pointerdown")) _distanceScale = distanceScale
    if(distanceScale < 1.10 && distanceScale > 0.9) distanceScale=1
    distanceScale = Lerp(_distanceScale,distanceScale,0.1)
    _distanceScale = distanceScale
    */
    vision.camera.s = vision.camera_cache.s
    vision.camera.x = vision.camera_cache.x
    vision.camera.y = vision.camera_cache.y

    vision.camera.zoomTo( distanceScale, frameDownCenter.x, frameDownCenter.y)
    vision.camera.x -= deltaPosition.x / (vision.camera_cache.scale*distanceScale)
    vision.camera.y -= deltaPosition.y / (vision.camera_cache.scale*distanceScale)
    vision.camera.render()
  }

  //------- Camera Zoom Mouse Whell ------------
  window.addEventListener("wheel", function(e) {
    // If target element is not scrollable element
    let scrollable = e.composedPath().some(e=>{
      if(e==bord.vision.elements.frame) return false
      if(e==bord.parent) return false
      if(e==document.body) return false
      if(e==document.documentElement) return false
      var hasHorizontalScrollbar = e.scrollWidth > e.clientWidth;
      var hasVerticalScrollbar = e.scrollHeight > e.clientHeight;
      if(hasHorizontalScrollbar || hasVerticalScrollbar){
        return true
      }
      return false;
    })
    // TODO :: Fix
    if(scrollable) return

    // Todo Test Frame Real Position
    let frame = vision.camera.framePositionFromClient(e.clientX,e.clientY);
    if (e.deltaY < 0) {
      vision.camera.zoomIn(-e.deltaY/120,frame.x,frame.y);
    } else {
      vision.camera.zoomOut(e.deltaY/120,frame.x,frame.y);
    }
  });


  //================= Elements =====================
  /**
   * Add Element to selected layer Camera
   * TODO: Send Element to Server 
   * Get ID from Server
   *    id: user_id + "_" + timestamp (response)
   */
  vision.lastId = 1;
  /**
   * Define Id & User Id
   */
  /**  @param {Drawing} data */
  vision.defineId = function(element){
    var data = element.data
    if(data.id){
      vision.lastId = Math.max(vision.lastId,data.id+1)
    }
    if(data.id == null){
      data.id = vision.lastId++;
    }
    if(data.user==null){
      data.user = info.user_id;
    }
    if(data.time==null){
      data.time = Date.now();
    }
    element.setAttribute("data-hash",data.user+"."+data.id)
  }

  vision.duplicateDrawings = function(items=vision.selectedDrawings){
    let newItems = []
    for(var i=0;i<items.length;i++){
      var item = items[i];
      var saved = vision.drawingSave(item)
      saved.id = null;
      saved.time = null;
      saved.user = null;
      var newItem = vision.drawingLoad(saved)
      vision.defineId(newItem)
      vision.bord.emit("drawingAdd", vision.drawingSave( newItem ) )
      newItems.push(newItem)
      vision.elements.camera.appendChild(newItem)
      item.classList.remove("selected")
      newItem.classList.add("selected")
    }
    vision.selectedDrawings = newItems;
    vision.selectedItems = vision.selectedMedias.concat(vision.selectedDrawings)
    return newItems
  }


  vision.add={
    /**
     * Container is a rectangle in selected area
     */
     newContainer: function(ratio=1,type="container",data={},isSelected=false,matrix=null){
      if(matrix==null) matrix = vision.selectRectangleElement.data.m;
      var container = document.createElement("div");
      container.classList.add("bord--vision--media-container");
      container.style.top = "-1000px";
      container.style.left = "-1000px";
      container.style.width = "2000px";
      container.style.height = "2000px";
      container.style.transform = "matrix("+matrix.join(",")+")";

      var naturalRatio = ratio;
      var selectMatrix = new Matrix(matrix)
      var selectWidth = selectMatrix.width(), 
          selectHeight = selectMatrix.height(), 
          selectRatio = selectWidth / selectHeight,
          selectRotation = selectMatrix.rotation(),
          selectX = selectMatrix.values[4],
          selectY = selectMatrix.values[5],
          itemMatrix = Matrix.identity(),
          itemWidth = 2000,
          itemHeight = 2000,
          itemLeft =-1000,
          itemTop =-1000,
          itemScale = 1,
          itemRight = null,
          itemBottom = null;
    
      if(ratio==null){
        naturalRatio=selectRatio;
      }

      
      // 2000 px genişlik yada yükseklik ayarı
      if(naturalRatio > 1){
        itemWidth = 2000
        itemHeight = itemWidth / naturalRatio
        itemLeft = -1000
        itemTop = -1000 + (2000-itemHeight)/2
        // Select ratio vs container ratio
        if(naturalRatio > selectRatio){ // Genişlik sabit
          itemScale = selectWidth 
        }else{  // Yükseklik Sabit
          itemScale = selectHeight * naturalRatio
        }
      }else{
        itemWidth = itemHeight * naturalRatio
        itemHeight = 2000
        itemLeft = -1000 + (2000-itemWidth)/2
        itemTop = -1000
        // Select ratio vs container ratio
        if(naturalRatio > selectRatio){ // Genişlik sabit
          itemScale = selectWidth / naturalRatio
        }else{  // Yükseklik Sabit
          itemScale = selectHeight
        }
      }

      itemMatrix.values[4] = matrix[4]
      itemMatrix.values[5] = matrix[5]

      itemMatrix.values[0] = itemScale
      itemMatrix.values[3] = itemScale
      itemMatrix.rotateFromCenter(selectRotation)
      

      itemRight = itemLeft + itemWidth
      itemBottom = itemTop + itemHeight

      container.style.width = itemWidth+"px"
      container.style.height = itemHeight+"px"
      container.style.left = itemLeft+"px"
      container.style.top = itemTop+"px"
      
      /** @type {Drawing} _container.data */
      container.data={}
      container.data.v = [itemLeft,itemTop,itemRight,itemTop,itemRight,itemBottom,itemLeft,itemBottom,itemLeft,itemTop]
      container.data.b = [itemWidth/2,itemHeight/2]
      container.data.time = Date.now()
      container.data.m = itemMatrix.values
      container.data.type = type
      container.data.data = data


      container.style.transform = "matrix("+container.data.m.join(",")+")"
      if(isSelected){
        vision.selectedItems.push(container)
        container.classList.add("selected")
      }

      vision.elements.mediaCamera.appendChild(container);
      this.sortMedias();
      return container
    },
    sortMedias:function(container=vision.elements.mediaCamera){
      let list=Array.from(bord.vision.elements.mediaCamera.children);
      list.map(e=>{
        var m = Matrix.fromElement(e)
        e.distance=m.width()**2 + m.height()**2
      })
      list = list.sort((a,b)=> b.distance - a.distance )
      list.map(e=>container.appendChild(e))
    },
    /** @param {Drawing} data */
    loadContainer:function(data,isSelected){
      var container = document.createElement("div");
      container.classList.add("bord--vision--media-container");
      container.data = data
      container.style.left = data.v[0] + "px"
      container.style.top = data.v[1] + "px"
      // Version Loop
      if(Math.max(data.b[0],data.b[1]) > 1000){
        data.b[0] /= 2
        data.b[1] /= 2
      }
      container.style.width = (data.b[0] * 2) + "px"
      container.style.height = (data.b[1] * 2) + "px"
      container.style.transform = "matrix("+data.m.join(",")+")"
      if(isSelected){
        vision.selectedItems.push(container)
        container.classList.add("selected")
      }
      vision.elements.mediaCamera.appendChild(container);
      return container
    },
    newMedia: function(type,data={},isSelected=true){
      Bord.Vision.Medias[type].size(data).then(e=>{
        var container = this.newContainer(e.ratio,type,data,isSelected)
        Bord.Vision.Medias[type].init(container,data)
        container.data.type = type
        vision.defineId(container)
        vision.bord.emit("mediaAdd",container.data)
      })
    },
    loadMedia: function(type,data,isSelected=true){
      var sizes = {
        width: data.b[0],
        height: data.b[1],
        ratio: data.b[0] / data.b[1]
      }
      var container = this.loadContainer(data,isSelected)
      Bord.Vision.Medias[type].init(container,data.data)
      container.data.type = type
      vision.defineId(container)
    }
  }

  //vision.add.image("https://upload.wikimedia.org/wikipedia/commons/6/60/ESO_-_Milky_Way.jpg")


  /** @param {(HTMLElement|SVGAElement)[]} elements */
  function ElementRemove(elements) {
    // TODO: Send Element ID to Server
    var hash = []
    elements.forEach(element => {
      hash.push(element.data.user+"."+element.data.id)
      element.remove()
    });
    vision.bord.emit("itemRemove", hash)

  }
  vision.removeElement = ElementRemove
  vision.removeSelectedElements = ()=>{
    ElementRemove(vision.selectedItems)
    vision.selectRectangleElement.rightTop?.remove()
    vision.selectRectangleElement.rightBottom?.remove()
    vision.selectRectangleElement.remove()
    vision.selectedItems = []
    vision.selectRectangleElement = null
    vision.lastAction="removed"
  }

  vision.removeFromHash = (hash)=>{
    var element = vision.elements.frame.querySelector(`[data-hash="${hash}"]`)
    if(element){
      element.style.transition = "opacity 0.5s"
      requestAnimationFrame(()=>{
        element.style.opacity = "0"
      });
      setTimeout(()=>{
        element.remove()
      },500)
    }
  }

  //vision.bord.keyboard.listeners.push({key:"KeyE",event: vision.removeSelectedElements})

  // TODO: Move & Rotate & Scale Element  (One Touch)

  //================ STROKE ================//
  vision.stroke={
    value:12,
    dataset:       {1:4,2:7,3:11,4:16,5:22,6:30},
    inverseDataset:{4:1,7:2,11:3,16:4,22:5,30:6},
    get:function(){ return  this.value/vision.camera.s },
    valueOf:function(){ return this.get() },
    toString:function(){ return this.get() },
    set:function(value){ 
      this.value = value;
      vision.selectedItems.forEach(element => {
        element.style.strokeWidth = this.get() / (new Matrix(element.data.m)).width()
      })
      vision.bord.emit("strokeChange",{value:this.get(),hash:vision.selectedItems.map(e=>e.data.user+"."+e.data.id)})
      vision.elements.buttonStroke.innerHTML = "<icon name='stroke_"+this.inverseDataset[value]+"'></icon>"
    }
  }

  //================= COLOR =================//
  vision.color={
    value:1,
    get palette(){ 
      let styles = GetStyle(".bord[theme=\""+vision.theme.get()+"\"]")
      return {
        0:styles["--backcolor-1"],
        1:styles["--color-1"],
        2:styles["--color-2"],
        3:styles["--color-3"],
        4:styles["--color-4"],
        5:styles["--color-5"],
        6:styles["--color-6"],
        "--backcolor-1":styles["--backcolor-1"],
        "--backcolor-2":styles["--backcolor-2"],
        "--backcolor-3":styles["--backcolor-3"],
      }
    },
    get:function(){ 
      return this.value
    },
    toString:function(){ return this.get() },
    set:function(value){ 
      this.value = value;
      vision.selectedItems.map(e=>e.setAttribute("color",value))
      //vision.action=null;
      vision.elements.buttonColor.style.backgroundColor = "var(--color-"+this.get()+")"
      var color = vision.elements.frame.computedStyleMap().get("--color-"+value)[0]
      vision.elements.buttonColor.style.color = Color.inverseColor(color)
      vision.bord.emit("colorChange",{value,hash:vision.selectedItems.map(e=>e.data.user+"."+e.data.id)})
    }
  }

  //=============== THEME ===============//
  vision.theme={
    value:"black",
    get:function(){ return this.value },
    set:function(value){
      this.value = value;
      vision.elements.frame.setAttribute("theme",value)
      vision.bord.parent.setAttribute("theme",value)
      vision.elements.buttonTheme.style.background = getComputedStyle(vision.elements.frame).background
      // TODO: Check Problem
      //vision.color.set(vision.color.value)
    }
  }

  // TODO: Beatiful Stroke (Triangle, Square, Circle, ...)

  // TODO: ID, User ID, Time, History for element, ...

  //=================== SAVE ===================//
  // TODO: Save
  /** @param {SVGElement} item @return {Drawing} */
  vision.drawingSave=function(item){
    if(item.dontSave===true) return null;
    var p = [],type=item.tagName.toLowerCase()
    if(type=="path"){
      //p = item.getAttribute("d").match(/(-*\d+)/g).map(e=>int(e))
      p = item.data.p.toString().split(",").map(e=>int(e))
    }else if(type=="polygon" || type=="polyline"){
      //p = item.getAttribute("points").match(/(-*\d+)/g).map(e=>int(e))
      p = item.data.p.toString().split(",").map(e=>int(e))
    }else{
      console.warn("ItemSave: Unknown Type",type)
      return null
    }
    var matrix = item.data.m;
    if(matrix.some(e=>isNaN(e))){
      matrix = Matrix.fromElement(item).values
    }

    item.data = {
      t:type,
      b:item.data.b,
      m:matrix,
      c:int(item.getAttribute("color")),
      s:float(item.style.strokeWidth),
      p:p,
      v:item.data.v,
      time:item.data.time,
      id:item.data.id,
      user:item.data.user,
    }
    return item.data
  }

  /** @param {SVGGElement} container */
  function DrawingContainerSave(container){
    let items = container.children
    let data = []
    Array.from(items).forEach(item => {
      var save = vision.drawingSave(item)
      if(save){
        data.push(save)
      }
    })
    return data
  }

  /** @param {HTMLElement} container */
  function MediaSave(container){
    let items = container.children
    let data = []
    Array.from(items).forEach(item => {
      if(item.save){
        data.push(item.save())
      }else{
        console.warn("MediaSave: Unknown Type",item)
      }
    })
    return data
  }

  /**
   * @returns {BordSave}
   */
  vision.save = function(){
    let data = {
      about:{
        title:"Nightbord",
        description:"New Generation Black Bord",
        authors:[{name:"Hasan Delibaş",id:1}],
        keywords:["nightbord"],
      },
      options:{
        theme:vision.theme.value,
        color:vision.color.value,
        stroke:vision.stroke.value,
        version:"1.1.0",
      },
      camera:{
        s:vision.camera.s,
        x:vision.camera.x,
        y:vision.camera.y,
      },
      layers:{
        space:[
          {name:"Main",drawings:DrawingContainerSave(vision.elements.camera) , medias:MediaSave(vision.elements.mediaCamera) ,id:1},
        ],
        bord:[
          {name:"Main",drawings:[],id:1},
        ]
      },
      coordinates: vision.coordinates,
    }

    vision.bord.emit("save",data)
    // Find in medias images
    var uploads = []
    // foreach layers
    for(var i=0;i<data.layers.space.length;i++){
      var layer = data.layers.space[i]
      for(var j=0;j<layer.medias.length;j++){
        var media = layer.medias[j]
        if(media.type=="image" && media.data.url.startsWith("data:image/")){
          // Convert to blob
          var blob = dataURItoBlob(media.data.url)
          // Add to uploads
          uploads.push({blob:blob,media:media})
        }
      }
    }
    function dataURItoBlob(dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      var byteString = atob(dataURI.split(',')[1]);
      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);
      // create a view into the buffer
      var ia = new Uint8Array(ab);
      // set the bytes of the buffer to the correct values
      for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
      }
      // write the ArrayBuffer to a blob, and you're done
      var blob = new Blob([ab], {type: mimeString});
      return blob;
    }
    function hash(s){
      return  Math.abs(s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(16);              
    }
    // TODO::: REMOVE
    // uploads = []
    if(uploads.length>0){
      return new Promise((resolve,reject)=>{
        WebEditable.FileManager.upload("/.pdf/",
          uploads.map(e=>({blob:e.blob,name: hash((Math.random()*1000000000).toString()) + ".png"}))
        ).then(e=>{
          e.map((e,i)=>{
            uploads[i].media.data.url = "files/.pdf/"+e
          })
          resolve(data)
        })
      })
    }else{
      return Promise.resolve(data)
    }
    

  }
  //=================== LOAD ===================//
  /** @param {Drawing} data @returns {SVGElement} */
  vision.drawingLoad=function(data){
    var type = data.t
    var element = Bord.Vision.Shapes.Create(type)
    element.data = data
    vision.defineId(element)
    element.setAttribute("color",data.c)
    element.style.strokeWidth = data.s
    element.style.transform = "matrix("+data.m.join(",")+")"
    if(type=="path"){
      
      
      // - WORKING - //
      
      //**  4+4+4+4 Version
      if(data.p.some(e=>isNaN(e)) || data.p.length%8!=0 ){
        console.warn("DrawingLoad: Point error",type,data.p)
        return null;
      }
      var points = Bord.Vision.Transform.ArraySplit(data.p,8)
        .map(e=> Bord.Vision.Transform.ArraySplit(e,2) ) 
      
      //**  4+3+3+3 Version
      // var points = Bord.Vision.Transform.PathDataToPoints(data.p.join(" "))
      // element.data.p = points;

      element.setAttribute("d", Bord.Vision.Transform.PointsToPathData(points))
      
    }else if(type=="polygon" || type=="polyline"){
      element.setAttribute("points",data.p.join(" "))
    }
    return element
  }


  function ContainerLoad(list,container){
    list.drawings.forEach(item => {
      var element = vision.drawingLoad(item)
      if(element){
        container.appendChild(element)
      }
    })
    list.medias.forEach(item => {
      vision.add.loadMedia(item.type,item,false)
    })
  }
  
  /** @param {BordSave} data  */
  vision.load = function(data,remove=false){
    if(remove){
      vision.elements.camera.innerHTML = ""
    }
    vision.data=data
    //@edit
    vision.theme.set(data.options.theme)
    vision.color.set(data.options.color)
    vision.stroke.set(data.options.stroke)
    //@endedit
    
    vision.elements.title.text.innerText=data.about.title

    vision.coordinates = data.coordinates || []

    vision.camera.s = data.camera.s
    vision.camera.x = data.camera.x
    vision.camera.y = data.camera.y
    vision.camera.render()
    // TODO: Loading Animation
    vision.elements.camera.innerHTML = ""
    ContainerLoad(data.layers.space[0],vision.elements.camera)

    // SAME ITEM LOADING FIX
    let items = Array.from(bord.vision.elements.mediaCamera.children);
    console.log("first items length = ", items.length)
    for(let i = items.length-1; i >= 0; i--){
      let a = items[i];
      for(let j=i-1; j >= 0; j--){
        let b = items[j];
        if(a.outerHTML == b.outerHTML){
          // a.remove();
          console.log("removed item" , i , a)
          break;
        }
      }
    }
    // items.map((e,i)=>{
    //   items.map((a,j)=>{
    //     if(i!=j && a!=e && a.outerHTML==e.outerHTML) a.remove()
    //   })
    // });
    items = Array.from(bord.vision.elements.mediaCamera.children);
    console.log("new items length = ", items.length)

    vision.add.sortMedias()


    vision.bord.emit("load",vision.data);
  }
  
  /** @type {BordSave} */
  vision.data = {}
  vision.data = {
    about:{
      title:"Nightbord",
      description:"New Generation Black Bord",
      authors:[{name:"Hasan Delibaş",id:1}],
      keywords:["nightbord"],
    },
    options:{
      theme:"black",
      color:1,
      stroke:1,
      version:"1.1.0",
    },
    camera:{
      s:1,
      x:0,
      y:0,
    },
    layers:{
      space:[
        {name:"Main",drawings:[],id:1},
      ],
      bord:[
        {name:"Main",drawings:[],id:1},
      ]
    },
    coordinates:[
      {x:0,y:0,s:1,name:"Start"},
    ]
  }



  return vision;
}


const int = (number) => parseInt(number);

const float = (number) => parseFloat(number);
/** source\Bord\Vision\Medias\Camera.js  **/
Bord.Vision.Medias.camera = Bord.Vision.Medias.Camera = {
  init: function(container,data) {
    var video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.transform = 'scaleX(-1)';

    /* Setting up the constraint */
    var facingMode = "user"; // Can be 'user' or 'environment' to access back or front camera (NEAT!)
    var constraints = {
      audio: false,
      video: {
        facingMode: facingMode,
        /*
        width: { min: 640, ideal: 640, max: 640 },
        height: { min: 480, ideal: 480, max: 480 },
        */
        /*
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 }
        */
      }
    };

    /* Stream it to video element */
    navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
      video.srcObject = stream;
    });
    container.save = this.save.bind(this,container)
    container.appendChild(video);
    return video;
  },
  size: function(){
    return new Promise((res,rej)=>{
      var video = document.createElement('video');
      navigator.mediaDevices.getUserMedia({video: true}).then(e=>{
        video.srcObject = e;
        video.onloadedmetadata = function(e) {
          res({
            width: video.videoWidth,
            height: video.videoHeight,
            ratio: video.videoWidth/video.videoHeight
          });
        }
      })
    });
  },
  save: function(container){
    return container.data;
  },
  load: function(container,data){
    this.init(container)
  }
}
/** source\Bord\Vision\Medias\Iframe.js  **/
Bord.Vision.Medias.iframe = Bord.Vision.Medias.Iframe = {
  init: function(container,data) {
    let iframe = document.createElement("iframe")
    iframe.crossOrigin = 'anonymous';
    iframe.src = data.url
    
    iframe.style.width = "40%"
    iframe.style.height = "40%"
    iframe.style.transform = "scale(2.5)"
    iframe.style.transformOrigin = "top left"
    iframe.style.border = "none"

    container.appendChild(iframe)

    // Iframe on load
    iframe.onload = function(){
      if(data.value){
        iframe.contentWindow.value = data.value;
      }
    }

    container.save = this.save.bind(this,container)
    return container
  },
  size: function(data){
    return Promise.resolve({
      width:null,
      height:null,
      ratio:null
    })
  },
  save: function(container){
    container.data.data.url = container.querySelector("iframe").getAttribute("src")
    var origin = new URL(container.querySelector("iframe").src).origin
    if( origin == location.origin ){
      container.data.data.value = container.querySelector("iframe").contentWindow.value
    }else{
      container.data.data.value = null
    }
    return container.data
  },
  load: function(container,data){

  }
}
/** source\Bord\Vision\Medias\Image.js  **/
Bord.Vision.Medias.image = Bord.Vision.Medias.Image = {
  /** @param {HTMLImageElement} image   */
  parseImage: function(container,image,size=1000) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    // TEST
    // document.body.append(canvas);
    // canvas.style.position = "absolute"
    // canvas.style.top = "0px"
    // canvas.style.left = "0px"
    // END TEST
    var ctx = canvas.getContext('2d');
    var width = size, height = size;
    for(var x=0;x<image.naturalWidth;x+=size){
      for(var y=0;y<image.naturalHeight;y+=size){
        if(x+size>image.naturalWidth){
          width = image.naturalWidth-x;
        }
        if(y+size>image.naturalHeight){
          height = image.naturalHeight-y;
        }
        ctx.clearRect(0,0,size,size);
        ctx.drawImage(image, x, y, size, size, 0, 0, size, size);
        var part = new Image();
        part.crossOrigin = 'Anonymous';
        part.src = canvas.toDataURL("image/png");
        var _left = 100*x/image.naturalWidth, 
            _top = 100*y/image.naturalHeight, 
            _width = 100*width/image.naturalWidth, 
            _height = 100*height/image.naturalHeight;
        part.style.left   =_left+'%';
        part.style.top    =_top +'%';
        part.style.width  =_width +'%';
        part.style.height =_height+'%';
        console.log(x,y,width,height);
        part.style.position='absolute';
        part.style.zIndex=0;
        container.appendChild(part);
      }
    }

  },
  init: function(container,data) {
    let image = document.createElement("img")
    image.crossOrigin = 'anonymous';
    image.src = data.url
    
    image.style.width = "100%"
    image.style.height = "100%"

    if(data.invertable){
      container.classList.add("bord--vision--media--paper")
    }

    container.appendChild(image)


    
    container.save = this.save.bind(this,container)
    return container
  },
  size: function(data){
    return new Promise((res,rej)=>{
      let image = document.createElement("img")
      image.onload = function(){
        res({
          width: image.naturalWidth,
          height: image.naturalHeight,
          ratio: image.naturalWidth/image.naturalHeight
        })
      }
      image.src = data.url
    })
  },
  save: function(container){
    container.data.data.url = container.querySelector("img").getAttribute("src")
    container.data.data.invertable = container.classList.contains("bord--vision--media--paper")
    return container.data
  },
  load: function(container,data){

  }
}
/** source\Bord\Vision\Medias\Video.js  **/
Bord.Vision.Medias.video = Bord.Vision.Medias.Video = {
  
  init: function(container,data) {
    let video = document.createElement("video")
    video.src = data.url
    video.controls = false
    video.style.width = "100%"
    video.style.height = "100%"
    video.crossOrigin = 'anonymous';
    
    container.appendChild(video)

    container.save = this.save.bind(this,container)
    return container
  },
  size: function(data){
    return new Promise((res,rej)=>{
      let video = document.createElement("video")
      video.onloadedmetadata = function(){
        res({
          width: video.videoWidth,
          height: video.videoHeight,
          ratio: video.videoWidth/video.videoHeight
        })
      }
      video.src = data.url
    })
  },
  save: function(container){
    container.data.data.url = container.querySelector("video").src
    return container.data
  },
  load: function(container,data){

  }
}
/** source\Bord\WebClass\WebClass.js  **/
Bord.WebClass = Bord.WebClass || (Bord.WebClass={})


var info = {
  is_owner: false,
  person_name: "Guest",
  room_id: "2",
}

Bord.WebClass.Init = function(bord){
  if(WebConnect){
    if(info.is_owner){
      Bord.WebClass.Start()
    }else{
      Bord.WebClass.Intro();
    }
    Bord.WebClass.Medias(bord)
  }
}

Bord.WebClass.videos = {}

Bord.WebClass.Start = function(){
  let bord = Bord.bord;
  bord.webConnect = new WebConnect({
    server:`/web-connect/server.php?room=${info.room_id}&name=${info.person_name}`,
    config:{
      data:true,
      video:true,
      audio:true
    }
  });

  bord.webConnect.send=function(data,hash=null){
    var length = JSON.stringify(data).length
    if(length>16000){
      console.warn("Sending",length/1000,"kb")
    }
    return bord.webConnect.sendData(JSON.stringify(data),hash)
  }

  let focusWaiter = setWaiter();
  
  if(info.is_owner){
    bord.on("focus",(coordinate,time)=>{
      console.log("focus",coordinate,time)
      bord.webConnect.send({type:"focus",coordinate,time})
      focusWaiter.wait(()=>{
      },200);
    })
    bord.on("drawingAdd",(data)=>{
      bord.webConnect.send({type:"drawingAdd",data})
    })
    bord.on("drawingRemove",(ids)=>{
      bord.webConnect.send({type:"drawingRemove",ids})
    })
    bord.on("mediaAdd",(data)=>{
      bord.webConnect.send({type:"mediaAdd",data})
    })
    bord.on("itemRemove",(ids)=>{
      bord.webConnect.send({type:"itemRemove",ids})
    })
    bord.on("dragend",(data)=>{
      bord.webConnect.send({type:"dragend",data})
    })
    bord.on("strokeChange",(data)=>{
      bord.webConnect.send({type:"strokeChange",data})
    })
    bord.on("colorChange",(data)=>{
      bord.webConnect.send({type:"colorChange",data})
    })


    bord.webConnect.when("connect",function(user,hash){
      console.log(hash,"connected")
      bord.vision.save().then((data)=>{
        bord.webConnect.send({type:"focus",
          coordinate:{
            x:bord.vision.camera.x,
            y:bord.vision.camera.y,
            s:bord.vision.camera.s,
          },
          time:1000
        } , hash)
        bord.webConnect.send({type:"load",data},hash)
      })
    })

  }

  bord.on("Assistant::CheckResult",(data)=>{
    bord.webConnect.send({type:"Assistant::CheckResult",data})
  })
  bord.on("Assistant::Subtitle",(data)=>{
    bord.webConnect.send({type:"Assistant::Subtitle",data})
  })
  bord.on("Assistant::Translate",(data)=>{
    bord.webConnect.send({type:"Assistant::Translate",data})
  })
  
  bord.on("WebClass::Fullscreen",(data)=>{
    bord.webConnect.send({type:"WebClass::Fullscreen",data})
  })


  bord.webConnect.onData = function(data,hash){
    data = JSON.parse(data)
    console.log("onData",data,hash)


    if(data.type=="load"){
      console.log("WebClass::load",data)
      bord.vision.load(data.data)
    }
    if(data.type=="focus"){
      bord.vision.camera.focus(data.coordinate.x,data.coordinate.y,data.coordinate.s,data.time,false)
    }
    if(data.type=="drawingAdd"){
      // TODO: Layer System Convert
      var element = bord.vision.drawingLoad(data.data)
      
      // drawing animation
      let length = element.getTotalLength();
      element.style.strokeDasharray = length;
      element.style.strokeDashoffset = length;
      element.style.transition = "all .5s";
      element.style.transitionDelay = "0.1s";

      bord.vision.elements.camera.appendChild( element );
      setTimeout(()=>{
        element.style.strokeDashoffset = "0";
      },100)
      setTimeout(()=>{
        element.style.strokeDasharray = null;
        element.style.strokeDashoffset = null;
      },1000)
    }
    if(data.type=="mediaAdd"){
      bord.vision.add.loadMedia(data.data.type,data.data,false)
    }
    if(data.type=="itemRemove"){
      var ids = data.ids;
      for(var i=0;i<ids.length;i++){
        var id = ids[i];
        bord.vision.removeFromHash(id)
      }
    }
    if(data.type=="dragend"){
      var list = data.data;
      list.forEach(({hash,m})=>{
        let element = bord.vision.elements.frame.querySelector(`[data-hash="${hash}"]`)
        if(element){
          element.style.transition = "transform 0.5s"
          requestAnimationFrame(()=>{
            element.style.transform = `matrix(${m[0]},${m[1]},${m[2]},${m[3]},${m[4]},${m[5]})`
          })
          element.data.m = m;
          setTimeout(()=>{ element.style.transition = null }, 500)
        }
      });
    }
    if(data.type=="strokeChange"){
      var list = data.data.hash;
      var stroke = data.data.value;
      list.forEach((hash)=>{
        let element = bord.vision.elements.frame.querySelector(`[data-hash="${hash}"]`)
        if(element){
          element.style.transition = "all 0.5s"
          requestAnimationFrame(()=>{
            element.style.strokeWidth = stroke / (new Matrix(element.data.m)).width()
          })
          setTimeout(()=>{ element.style.transition = null }, 500)
        }
      });
    }
    
    if(data.type=="colorChange"){
      var list = data.data.hash;
      var color = data.data.value;
      list.forEach((hash)=>{
        let element = bord.vision.elements.frame.querySelector(`[data-hash="${hash}"]`)
        if(element){
          element.style.transition = "all 0.5s"
          requestAnimationFrame(()=>{
            element.setAttribute("color",color)
          })
          setTimeout(()=>{ element.style.transition = null }, 500)
        }
      });
    }

    if(data.type=="Assistant::CheckResult"){
      Assistant.transcript = data.data
      Assistant.CheckResult(false)
      //bord.emit("Assistant::CheckResult",data.data)
    }

    if(data.type=="Assistant::Subtitle"){
      Assistant.elements.subtitle.innerHTML = data.data;
    }
    if(data.type=="Assistant::Translate"){
      Assistant.elements.translateSubtitle.innerHTML = data.data;
    }

    /* WebConnect Disable Camera */
    if(data.type=="WebConnect::disableCamera"){
      Bord.WebClass.videos[data.id] = false
    }
    if(data.type=="WebConnect::enableCamera"){
      Bord.WebClass.videos[data.id] = true
    }

    if(data.type=="WebClass::Fullscreen"){
      var hash = data.data;
      Array.from(document.querySelectorAll(".bord--web-class--user")).map((e)=>{ e.classList.remove("fullscreen-media") })
      document.querySelector(`.bord--web-class--user[user-hash="${hash}"]`)?.classList.add("fullscreen-media")
    }

  }



  bord.webConnect.onConnect = function(user,hash){
    console.log("onConnect",hash)
    Bord.WebClass.User(user);
  }
  bord.webConnect.onDisconnect = function(user,hash){
    console.log("onDisconnect",hash)
    var userPanel = Bord.WebClass.medias[user.hash];
    if(userPanel){
      userPanel.remove();
      Bord.WebClass.medias[user.hash] = null;
    }
  }

  //-- video --//
  bord.webConnect.onVideoAdd = function(element,user){
    console.log("onVideoAdd",user.hash)
    return;
    var userPanel = document.querySelector(`[data-hash="${user.hash}"]`)
    if(userPanel){
      userPanel.appendChild(element)
    }else{
      userPanel = Bord.WebClass.User(user)
      userPanel.appendChild(element)
    }
    // Old Stable
    /*
    element.onclick = function(e){
      if(element.classList.contains("fullscreen-media")==false){
        Array.from(document.querySelectorAll(".fullscreen-media")).forEach(e=>{
          e.classList.remove("fullscreen-media")
        })
      }
      element.classList.toggle("fullscreen-media")
    }
    element.classList.add("no-action")
    Bord.WebClass.medias.append(element)
    */
  }

  bord.webConnect.onAudioAdd = function(element,user){
    console.log("onAudioAdd",user.hash)
  }


  function AutoRemoveDisconnectedPeer(){
    let peers = Object.keys(bord.webConnect.connecttedPeers).concat([bord.webConnect.hash])
    let userPanels = document.querySelectorAll("[user-hash]")
    for(var i=0;i<userPanels.length;i++){
      let userPanel = userPanels[i]
      let userHash = userPanel.getAttribute("user-hash")
      if(peers.indexOf(userHash)==-1){
        userPanel.remove()
        Bord.WebClass.medias[userHash] = null;
      }
    }
  }

  setInterval(AutoRemoveDisconnectedPeer,1000)

  Bord.WebClass.Auto = function(){
    bord.vision.elements.cameraButton.style.color = bord.webConnect.isCameraEnabled ? "var(--color-2)" : null;
    bord.vision.elements.microphoneButton.style.color = bord.webConnect.isMicrophoneEnabled ? "var(--color-2)" : null;

    Object.values(bord.webConnect.connecttedPeers).forEach((peer)=>{
      var pc = peer.pc;
      var userPanel = Bord.WebClass.User(peer.user);
      var remoteStreams = pc.getRemoteStreams();
      remoteStreams.forEach((stream)=>{
        // Get Tracks
        var tracks = stream.getTracks();
        tracks.forEach((track)=>{
          if(track.kind=="video"){
            var video = userPanel.querySelector(`video[stream-id="${stream.id}"]`)
            
            if(video==null /* && track.readyState=="live" */ ){
              video = document.createElement("video")
              video.setAttribute("stream-id",stream.id)
              video.setAttribute("track-id",track.id)
              video.setAttribute("autoplay","")
              video.setAttribute("playsinline","")
              video.setAttribute("muted","")
              video.setAttribute("user-hash",peer.user.hash)
              video.srcObject = stream;
              video.play();
              userPanel.appendChild(video)
            }else{
              // If video is not playing then play it
              if(video.paused || video.srcObject==null){
                video.srcObject = stream;
                video.play()
              }
            }

            if(Bord.WebClass.videos[stream.id]===false){
              video.style.display = "none"
            }
            if(Bord.WebClass.videos[stream.id]===true){
              video.style.display = null
            }
            

            track.onended = function(){
              video.remove();
            }
            stream.addEventListener("removetrack",function(e){
              if(e.track==track){
                video.remove();
              }
            })
            stream.addEventListener("inactive",function(e){
              video.remove();
            })
            if(track.readyState=="ended" || track.enabled==false){
              video.remove();
            }
          }
          if(track.kind=="audio"){
            var audio = userPanel.querySelector(`audio[audio-id="${track.id}"]`)
            if(audio==null && track.enabled){
              audio = document.createElement("audio")
              audio.setAttribute("audio-id",track.id)
              audio.setAttribute("autoplay","")
              audio.setAttribute("playsinline","")
              audio.srcObject = stream;
              audio.play();
              userPanel.appendChild(audio)
            }else{
              if(audio.srcObject!=stream){
                audio.srcObject = stream;
                audio.play();
              }
            }
            track.onended = function(){
              audio.remove();
            }
            stream.addEventListener("removetrack",function(e){
              if(e.track==track){
                audio.remove();
              }
            })
            stream.addEventListener("inactive",function(e){
              audio.remove();
            })
            if(track.readyState=="ended" || track.enabled==false){
              audio.remove();
            }

          }
        })
      })
    })

    if(Bord.WebClass.selfUser){
      Bord.WebClass.selfUser.setAttribute("user-hash",bord.webConnect.hash)
      if(bord.webConnect.localVideo){
        if(bord.webConnect.localVideo.parentNode!=Bord.WebClass.selfUser){
          Bord.WebClass.selfUser.appendChild(bord.webConnect.localVideo)
          bord.webConnect.localVideo.style.transform = "scaleX(-1)"
        }
        if(bord.webConnect.isCameraEnabled){
          bord.webConnect.localVideo.style.display = null
        }else{
          bord.webConnect.localVideo.style.display = "none"
        }
      }
    }

  }

          

  /*
    var video = userPanel.querySelector(`video[track-id="${stream.id}"]`)
    if(video==null){
      video = document.createElement("video")
      video.setAttribute("track-id",stream.id)
      video.srcObject = stream;
      video.play();
      userPanel.appendChild(video)
    }else{
      if(video.srcObject!=stream){
        video.srcObject = stream;
        video.play();
      }
    }
    */


  setInterval(Bord.WebClass.Auto,1000)


}
/** source\_Library\Animate.js  **/
const Animate = {
	ZoomIn: function(element, callback = null) {
		element.style.display = "block";
		return;
		element.style.transform = "scale(0)";
		element.style.opacity = "0";
		element.style.display = "block";
		setTimeout(() => {
			element.style.transform = "scale(1)";
			element.style.opacity = "1";
			if (callback) {
				callback();
			}
		}, 100);
	},
	ZoomOut: function(element, callback = null) {
		return element.style.display = "none";
		element.style.transform = "scale(1)";
		element.style.opacity = "1";
		setTimeout(() => {
			element.style.transform = "scale(0)";
			element.style.opacity = "0";
			if (callback) {
				callback();
			}
		}, 100);
	}
}

/** source\_Library\jsonp.js  **/


function jsonp(url) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    var f="jsonp"+(+new Date()), b=document.body;
    window[f] = d=>{ delete window[f]; b.removeChild(s); resolve(d); };
    s.src=`${url}${url.includes('?')?'&':'?'}callback=${f}&v=1.0`;
    b.appendChild(s);
  })
}

/** source\_Library\setWaiter.js  **/

function setWaiter(_action=()=>{}, _time = Infinity) {
	let base = {};
	base.time = _time;
	base.action = _action;
	base.timeout = setTimeout(_action, _time);
	base.wait = function (action = null, time = null) {
		if (base.timeout) {
			clearTimeout(base.timeout);
		}
		if (typeof action === 'function') {
			base.action = action;
		}
		if (typeof action === 'number') {
			base.time = action;
		}
		if (typeof time === 'number') {
			base.time = time;
		}
		base.timeout = setTimeout(base.action, base.time);
	}
	return base;
}