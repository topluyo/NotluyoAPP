function Asena(html){
      var mime = html.indexOf("xmlns=") == -1 ? "text/html" : "image/svg+xml";   
      var parsed= Asena.parser.parseFromString(html, mime);
      return mime=="text/html" ? parsed.body.firstChild : parsed.firstChild;
    }
      Asena.parser = new DOMParser();
    
/** source\Bord\Bord.view  **/
/** source\Bord\Bord.view **/
var Bord = Bord || {};
  Bord.Bord = function(filePath){



  let bord=this;
  Emitter(bord)
  Bord.bord = bord;
  Bord.Base.Keyboard(bord);
  {

    let that=PARENT=bord.parent=Asena(`<div class="bord" theme="black"></div>`);
    that.append( Bord.Vision.Init(bord).elements.frame )

  document.body.append(bord.parent)

  let vision = bord.vision
  bord.vision.camera.resize()

//-- Add Plugins  --//
// Init Presentation 
  Bord.Presentation.Init(bord)
// Assistant
  Assistant.Init(bord)

  bord.save=function(){
    vision.save().then(console.log)
  }

  bord.load=function(file){
    if(bord.vision.elements.saveButton)
      bord.vision.elements.saveButton.disabled=true
// Fetch with disable chache
    if(!file.startsWith("http")){
      file = "//app.nightbord.com"+file
    }
    fetch( file ,{
      method:"GET",
      cache: "no-cache",
      headers:{
        "Content-Type":"application/json"
      }
    }).then(res=>res.json()).then(res=>{
      vision.load(res,true)
      if(bord.vision.elements.saveButton) bord.vision.elements.saveButton.disabled=false
    })
  }
  if(arguments.length==1 && arguments[0]!=null ){
    bord.load(arguments[0])
  }


// Fix Scroll
  window.addEventListener("scroll", function () {
    console.log("scroll")
    document.body.scrollLeft=0;
    document.body.scrollTop=0; 
  }, false);
  setInterval(() => {
    document.body.scrollLeft=0;
    document.body.scrollTop=0;  
  }, 250);











  };
  }


/** source\Bord\Assistant\Assistant.view  **/
/** source\Bord\Assistant\Assistant.view **/
var Bord = Bord || {};
Bord.Assistant = Bord.Assistant || {};
  Bord.Assistant.Assistant = function (bord) {


    {

      let that=PARENT=Assistant.elements.panel=Asena(`<div class="bord--assistant--panel bord--modal" style="display:none"></div>  `);
      {
      let PARENT = that;{

        let that=close=Asena(`<div class="bord--modal--close"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=_=Asena(`<icon name="close"></icon>`);
          PARENT.append(that);
        }
        }
      close.onclick = function(){
        Assistant.elements.panel.style.display = "none";
        if(Assistant.elements.panel.onclose) Assistant.elements.panel.onclose();
      }
      {

        let that=_temp=Asena(`<div class="bord--assistant--panel--content"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=_temp=Asena(`<div class="bord--assistant--panel--content--item"></div>`);
          PARENT.append(that);
          {
          let PARENT = that;{

            let that=Assistant.elements.title=Asena(`<div class="bord--assistant--panel--title">Assistant</div>`);
            PARENT.append(that);
          {

            let that=Assistant.elements.description=Asena(`<div class="bord--assistant--panel--description">Assistant is a tool for creating presentations. You can create presentations with the help of the assistant.</div>`);
            PARENT.append(that);
          }
          }
          }
        {

          let that=Assistant.elements.image=Asena(`<img class="bord--assistant--panel--image"></img>`);
          PARENT.append(that);


        }
        }
        }
      }
      }
      }
    {

      let that=PARENT=Assistant.elements.parent=Asena(`<div class="bord--assistant" style="display:none"></div>`);
      {
      let PARENT = that;{

        let that=Assistant.elements.face=Asena(`<div class="bord--assistant--face"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="https://cdn.jsdelivr.net/gh/HasanDelibas/bord-asset@main/albert-einstein.png"></img>`);
          PARENT.append(that);


        }
        }
      {

        let that=Assistant.elements.speaker=Asena(`<div class="bord--assistant--speaker"></div>`);
        PARENT.append(that);
      {

        let that=_temp=Asena(`<div class="bord--assistant--subtitle"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=Assistant.elements.subtitle=Asena(`<div></div>`);
          PARENT.append(that);
        }
        }
      {

        let that=Assistant.elements.translateSubtitle=Asena(`<div class="bord--assistant--translate--subtitle" style='display:none'></div>`);
        PARENT.append(that);


      }
      }
      }
      }
      }
    bord.vision.elements.frame.appendChild(Assistant.elements.parent)
    bord.vision.elements.frame.appendChild(Assistant.elements.panel)
    bord.parent.appendChild(Assistant.elements.panel)
    }
    }
  }


  Bord.Assistant.Designer = function(data){
    let bord = Bord.bord
    let plugin = bord.assistant.designer = {}
    plugin.elements = {}
    {

      let that=PARENT=plugin.container=Asena(`<div class="bord--container bord--container--default no-action" style='display:none'></div>`);
      {
      let PARENT = that;{

        let that=_=Asena(`<div class="bord--container--header"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=_=Asena(`<div class="bord--container--title"></div>`);
          PARENT.append(that);
          {
          let PARENT = that;{

            let that=plugin.elements.button=Asena(`<icon name="plus" class="bord--button--icon"></icon>`);
            PARENT.append(that);
          {

            let that=_=Asena(`<span>Assistant Designer</span>`);
            PARENT.append(that);
          }
          }
          }
        {

          let that=_=Asena(`<icon name="close" class="bord--container--close bord--button--icon"></icon>`);
          PARENT.append(that);
        }
        }
        }
      {

        let that=_=Asena(`<div class="bord--container--body"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=plugin.elements.name=Asena(`<input type="name" placeholder="Assistant Name"></input>`);
          PARENT.append(that);
          plugin.elements.name.oninput=()=>{bord.assistant.name=plugin.elements.name.value}
        {

          let that=plugin.elements.body=Asena(`<div class="bord--plugin--coordinates-container-list no-action"></div>`);
          PARENT.append(that);

        }
        }
        }
      }
      }
      }
    bord.parent.appendChild(plugin.container)

    plugin.elements.button.onclick = function(){
      let item = Bord.Assistant.Designer.Item({commands:"",actions:{"Assistant::Speak":""}})
      plugin.elements.body.appendChild(item)
    }

    bord.on("load",function(data){
      console.log("onLoad",data)
      if(data.assistant==null){
        data.assistant = {}
        data.assistant.commands = []
        data.assistant.name = "Einstein"
      }

      if(data.assistant.name==null) data.assistant.name = "Einstein"
      if(data.assistant.commands==null) data.assistant.commands = []

      for(let item of data.assistant.commands){
        plugin.elements.body.appendChild(Bord.Assistant.Designer.Item(item))
      }
      plugin.elements.name.value = data.assistant.name

// TODO: Open here
      Bord.bord.assistant.commands=data.assistant.commands
      bord.assistant.name = data.assistant.name
    })

    bord.on("save",function(data){
      data.assistant = {
        commands: bord.assistant.commands,
        name: bord.assistant.name
      }
    })


    }
  }



  /*
  {
    commands: "string",
    actions: {
      "Action::Name": ["param1","param2"],
      ...
    }

  }

  */

  Bord.Assistant.Designer.OnChange = function(){
    let plugin = bord.assistant.designer
    let datas = []
    for(let item of plugin.elements.body.children){
      let data = {
        commands: item.command.value,
        actions: {}
      }
      var actions = Array.from( item.querySelectorAll(".bord--assistant--designer--item--action") )
      for(let action of actions){
        let key = action.key.value
        let params = action.params.value
        data.actions[key] = params
      }
      datas.push(data)
    }
    Bord.bord.assistant.commands=datas
    return datas
  }

  Bord.Assistant.Designer.Item = function(data){
    let item;
    {

      let that=PARENT=item=Asena(`<div class="bord--assistant--designer--item"></div>`);
      {
      let PARENT = that;{

        let that=_=Asena(`<div style="padding:0.2em"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=item.command=Asena(`<input type="text" name="commands" placeholder="Command" style="width:100%"></input>`);
          PARENT.append(that);
        for(let key in data.actions){
          item.appendChild(Bord.Assistant.Designer.Action(key,data.actions[key]))
        }
        item.command.oninput = Bord.Assistant.Designer.OnChange
        item.command.value = data.commands

        }
        }
      }
      }
    return item;
    }
  }

  Bord.Assistant.Designer.Action = function(key,params){
    let action;
    {

      let that=PARENT=action=Asena(`<div class="bord--layout-2 bord--assistant--designer--item--action" style="padding:0.2em"></div>`);
      {
      let PARENT = that;{

        let that=action.key=Asena(`<select></select>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=_=Asena(`<option value="None">None</option>`);
          PARENT.append(that);
        {

          let that=_=Asena(`<option value="Assistant::Speak">Assistant::Speak</option>`);
          PARENT.append(that);
        }
        }
        }
      {

        let that=action.params=Asena(`<input type="text" name="params" placeholder="Params"></input>`);
        PARENT.append(that);
      }
      }
      }
    action.key.value = key
    action.params.value =params
    action.key.onchange = Bord.Assistant.Designer.OnChange
    action.params.oninput = Bord.Assistant.Designer.OnChange
    return action
    }
  }




/** source\Bord\Components\Modal.view  **/
/** source\Bord\Components\Modal.view **/
var Bord = Bord || {};
Bord.Components = Bord.Components || {};
  Bord.Components = Bord.Components || (Bord.Components={});
  Bord.Components.Modal = function (title,content) {
    let modal = {};
    {

      let that=PARENT=modal=Asena(`<div class="bord--modal"></div>`);
      {
      let PARENT = that;{

        let that=_temp=Asena(`<div class="bord--modal--title">${title}</div>`);
        PARENT.append(that);
      {

        let that=close=Asena(`<div class="bord--modal--close"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=_temp=Asena(`<icon name="close"></icon>`);
          PARENT.append(that);
        }
        }
      close.onclick = ()=>{modal.close()}
      {

        let that=_temp=Asena(`<div class="bord--modal--content"></div>`);
        PARENT.append(that);
        _temp.append(content)

      }
      }
      }
      }
    modal.close = function(e){
      modal.style.display = "none";
      if(modal.onclose) modal.onclose();
    }
    bord.parent.append(modal)
    return modal;
    }
  }



/** source\Bord\Import\Import.view  **/
/** source\Bord\Import\Import.view **/
var Bord = Bord || {};
Bord.Import = Bord.Import || {};
  Bord.Import.Modal = function(){
    let parent,buttons={};
    {

      let that=PARENT=parent=Asena(`<div class="bord--modal no-action"></div>`);
      {
      let PARENT = that;{

        let that=buttons['image']=Asena(`<button>Image</button>`);
        PARENT.append(that);
      {

        let that=buttons['video']=Asena(`<button>Video</button>`);
        PARENT.append(that);
      {

        let that=buttons['pdf']=Asena(`<button>Pdf</button>`);
        PARENT.append(that);
      {

        let that=buttons['paper']=Asena(`<button>Paper</button>`);
        PARENT.append(that);

      }
      }
      }
      }
      }
    for(let key in buttons){
      buttons[key].onclick=()=>{
// Bord.Import.Import(key)
//modal.close()
      }
    }

    let modal=Bord.Components.Modal("Import",parent)

    }
  }


/** source\Bord\Presentation\Presentation.view  **/
/** source\Bord\Presentation\Presentation.view **/
var Bord = Bord || {};
Bord.Presentation = Bord.Presentation || {};
  Bord.Presentation.Presentation = function(){
  let bord = this;
  let presentation = bord.presentation
  let vision = bord.vision

  presentation.elements = {}


//-- Coordinates UI --//
  {

    let that=PARENT=presentation.elements.view=Asena(`<div class="bord--presentation no-action" style='--index:0;display:none;'></div>`);
    {
    let PARENT = that;{

      let that=presentation.elements.left=Asena(`<icon name='left' style='visibility:hidden;' key="ArrowLeft" command="Önceki Sayfa"></icon>`);
      PARENT.append(that);
    {

      let that=presentation.elements.items=Asena(`<div class="bord--presentation--items" style='flex:1'></div>`);
      PARENT.append(that);
    {

      let that=presentation.elements.right=Asena(`<icon name='right' style='visibility:hidden;' key="ArrowRight" command="Sonraki Sayfa"></icon>`);
      PARENT.append(that);

    presentation.elements.left.onclick = ()=> presentation.previous()
    presentation.elements.right.onclick = ()=> presentation.next()


    }
    }
    }
    }
  vision.bord.parent.append(presentation.elements.view)


//-- Coordinates Edit Container --//


  presentation.index = -1;
  presentation.go = function (index,time=null) {
    if(typeof index == "string"){
      index = vision.coordinates.findIndex(e=>e.name.toLocaleLowerCase()==index.toLocaleLowerCase())
      if(index==-1) return
    }else{
      index = parseInt(index)
    }
    if (index < 0) { index = 0 }
    if (index > vision.coordinates.length - 1) { index = vision.coordinates.length - 1 }
    presentation.index = index;
    var coordinate = vision.coordinates[index]
    var distance = Math.sqrt(Math.pow(coordinate.x - vision.camera.x, 2) + Math.pow(coordinate.y - vision.camera.y, 2))
    var distanceScale = Math.abs(Math.log(coordinate.s/vision.camera.s))
    var time = time != null ? time : (1 + distanceScale)*1000

    vision.camera.focus(coordinate.x,coordinate.y,coordinate.s,time)
    if(presentation.animation) presentation.animation.stop()
    let writingElements = bord.vision.findItemsInBound(
      bord.vision.camera.bound(coordinate.x,coordinate.y,coordinate.s)
    ).drawings
    let currentSeeing = bord.vision.findItemsInBound( bord.vision.camera.bound() ).drawings
    for(let i=writingElements.length-1;i>=0;i--){
      if(currentSeeing.indexOf(writingElements[i])!==-1){
        writingElements.splice(i,1)
      }
    }
//!! Disabled
    writingElements = []

//-- Play Media When Focus --//
    let playingMedias = bord.vision.findItemsInBound(
      bord.vision.camera.bound(coordinate.x,coordinate.y,coordinate.s)
      ,true
    ).medias
    console.log(playingMedias.length,playingMedias)
    let currentPlaying = bord.vision.findItemsInBound( bord.vision.camera.bound() , true ).medias
    for(let i=playingMedias.length-1;i>=0;i--){
      if(currentPlaying.indexOf(playingMedias[i])!==-1){
        playingMedias.splice(i,1)
      }
    }
    console.log(playingMedias.length,playingMedias)
    setTimeout(()=>{
      for(let i=0;i<playingMedias.length;i++){
        if(playingMedias[i].querySelector("video")){
          playingMedias[i].querySelector("video").play()
        }
      }
    },time)
////////////////////////////////////



    let animation = presentation.animation = Bord.Animation.Write( writingElements ,2000)
    presentation.animation.pause()
    setTimeout(()=>{
      console.log("Start")
      if(presentation.animation == animation) presentation.animation.play()
    },time)

    presentation.elements.view.style.setProperty("--index", index)
    Array.from(presentation.elements.items.children).forEach(e=>e.classList.remove("active"));
    presentation.elements.items.children[index].classList.add("active")

  }
  presentation.next = function () {
    if (presentation.index < vision.coordinates.length - 1) {
      presentation.go(presentation.index + 1)
    }
  }
  presentation.previous = function () {
    if (presentation.index > 0) {
      presentation.go(presentation.index - 1)
    }
  }

  presentation.refresh = function () {
    Bord.Presentation.Views.renderView(vision.coordinates)
  }

  Bord.Presentation.Views = {}
  Bord.Presentation.Views.renderView = function (datas) {
    presentation.elements.items.innerHTML = ""
    for(let i = 0 ; i < datas.length ; i++){
      let data = datas[i]
      let item;
      {

        let that=PARENT=item=Asena(`<div class='bord--presentation--coordinate--item' style='--item-index:${i}'>${data.name}</div>`);
      item.onclick = function(){ presentation.go(i) }
      item.onpointerdown = function(e){ 
// if right click
        if(e.button == 2){
          vision.coordinates[i].x = vision.camera.x
          vision.coordinates[i].y = vision.camera.y
          vision.coordinates[i].s = vision.camera.s
        }
      }
      presentation.elements.items.append(item)
      }
    }

  }


  }
  }


/** source\Bord\Vision\Vision.Add.view  **/
/** source\Bord\Vision\Vision.Add.view **/
var Bord = Bord || {};
Bord.Vision = Bord.Vision || {};
  Bord.Vision.Add = function(){
    let bord = Bord.bord;
    let vision = bord.vision;
    if(Bord.Vision.Add.instance!=undefined){
      Bord.Vision.Add.modal.style.display = "block";
      return;
    }
    {

      let that=PARENT=Bord.Vision.Add.instance  = Asena(`<div class="bord--vision--add" style="padding:1em;display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));"></div>`);
      Bord.Vision.Add.instance.onclick=()=>{ Bord.Vision.Add.modal.style.display = "none"; }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<div class="bord--vision--add--button" style="text-align:center;"></div>  `);
        PARENT.append(that);
        that.onclick = ()=> { 
          WebEditable.FileManager.Select("image").then((file)=>{
            vision.add.newMedia("image",{url:'files/'+file[0]},true)
          })
        }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="/public/images/image.png" style="width:100px;height:100px;object-fit:contain;"></img>`);
          PARENT.append(that);
        {

          let that=_temp=Asena(`<div>Image</div>`);
          PARENT.append(that);

        }
        }
        }
      {

        let that=_temp=Asena(`<div class="bord--vision--add--button" style="text-align:center;"></div>  `);
        PARENT.append(that);
        that.onclick = ()=> { Bord.Pdf.Add(vision.bord) }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="/public/images/pdf.png" style="width:100px;height:100px;object-fit:contain;"></img>`);
          PARENT.append(that);
        {

          let that=_temp=Asena(`<div>Pdf</div>`);
          PARENT.append(that);

        }
        }
        }
      {

        let that=_temp=Asena(`<div class="bord--vision--add--button" style="text-align:center;"></div>  `);
        PARENT.append(that);
        that.onclick = ()=> { Bord.Pdf.Add(vision.bord,{gray:true,invertable:true}) }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="/public/images/paper.png" style="width:100px;height:100px;object-fit:contain;"></img>`);
          PARENT.append(that);
        {

          let that=_temp=Asena(`<div>Paper</div>`);
          PARENT.append(that);

        }
        }
        }
      {

        let that=_temp=Asena(`<div class="bord--vision--add--button" style="text-align:center;"></div>`);
        PARENT.append(that);
        that.onclick = ()=> { 
          WebEditable.FileManager.Select(".mp4,.mpeg").then((file)=>{
            vision.add.newMedia("video",{url:'files/'+file[0]},true)
          })
//let url = prompt("Dosya url","https://app.nightbord.com/bords/hasandelibas/files/reyhan/merhaba.mp4")
//if(url) vision.add.newMedia("video",{url:url},true)
        }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="/public/images/video.png" style="width:100px;height:100px;object-fit:contain;"></img>`);
          PARENT.append(that);
        {

          let that=_temp=Asena(`<div>Video</div>`);
          PARENT.append(that);

        }
        }
        }
      {

        let that=_temp=Asena(`<div class="bord--vision--add--button" style="text-align:center;"></div>`);
        PARENT.append(that);
        that.onclick = ()=> {
          let url = prompt("Url","https://www.youtube.com/embed/v6NAZOXo5iI")
          if(url) vision.add.newMedia("iframe",{url:url},true)
        }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="/public/images/iframe.png" style="width:100px;height:100px;object-fit:contain;"></img>`);
          PARENT.append(that);
        {

          let that=_temp=Asena(`<div>Iframe</div>`);
          PARENT.append(that);

        }
        }
        }
      {

        let that=_temp=Asena(`<div class="bord--vision--add--button" style="text-align:center;"></div>`);
        PARENT.append(that);
        that.onclick = ()=> {
          let url = "/source/Bord/Vision/Medias/CodeEditor/index.html?language=python"
          vision.add.newMedia("iframe",{url:url},true)
        }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="/public/images/python.png" style="width:100px;height:100px;object-fit:contain;"></img>`);
          PARENT.append(that);
        {

          let that=_temp=Asena(`<div>Python Code</div>`);
          PARENT.append(that);



        }
        }
        }
      Bord.Vision.Add.modal = Bord.Components.Modal("Add",Bord.Vision.Add.instance);
      }
      }
      }
      }
      }
      }
      }
    }
  }


/** source\Bord\Vision\Vision.view  **/
/** source\Bord\Vision\Vision.view **/
var Bord = Bord || {};
Bord.Vision = Bord.Vision || {};
  Bord.Vision.Vision = function(){
  let bord = this;
  let vision = bord.vision;
  vision.bord = bord


  Bord.Vision.instance = vision;
  vision.elements = {}
  {

    let that=PARENT=vision.elements.frame=Asena(`<div class="bord--vision"></div>`);
//--- Title ---//

    {
    let PARENT = that;{

      let that=vision.elements.title=Asena(`<div class="bord--vision--title"></div>`);
      PARENT.append(that);
      {
      let PARENT = that;{

        let that=_temp=Asena(`<a href='#' class="bord--vision--title-link"></a>`);
        PARENT.append(that);
        _temp.href=location.origin
        {
        let PARENT = that;{

          let that=_temp=Asena(`<img src="/public/logos/nightbord-thin-dark.svg" class="bord--vision--title--image" />`);
          PARENT.append(that);
        }
        }
      {

        let that=vision.elements.title.box=Asena(`<div style="display:flex;flex-direction:column;justify-content:center;"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=vision.elements.title.text=Asena(`<div class="bord--vision--title--text">View Title</div>`);
          PARENT.append(that);
//vision.elements.title.link=<div class="bord--vision--title--url">{ decodeURI( location.href.replace("https://","").replace("alfa.","app.") ) }</div>
        {

          let that=vision.elements.title.link=Asena(`<div class="bord--vision--title--url">${ decodeURI( location.pathname.substring(1) ) }</div>`);
          PARENT.append(that);
        }
        }
        }
      {

        let that=vision.elements.title.time=Asena(`<div class="bord--vision--title--time" style="display: flex;align-items: center;flex-direction:row;justify-content: center;gap: 0.25em;"></div>`);
        PARENT.append(that);
        vision.elements.title.time.active=true;
        vision.elements.title.time.value = 0;
        {
        let PARENT = that;{

          let that=vision.elements.title.time.start=Asena(`<icon class="bord--button--icon" name="play"></icon>`);
          PARENT.append(that);
        {

          let that=vision.elements.title.time.pause=Asena(`<icon class="bord--button--icon" name="pause" style="display:none"></icon>`);
          PARENT.append(that);
        {

          let that=vision.elements.title.time.text=Asena(`<b class="bord--vision--title--time--text">00:00</b>`);
          PARENT.append(that);
        {

          let that=vision.elements.title.time.stop=Asena(`<icon class="bord--button--icon" name="stop"></icon>`);
          PARENT.append(that);
        {

          let that=_=Asena(`<div class="bord--vision--title--time--separator" style="font-size: 12px;display: flex;justify-content: space-between;flex-direction: row;width: 100%;"></div>`);
          PARENT.append(that);
        vision.elements.title.time.start.onclick = ()=>{ vision.elements.title.time.active=true; vision.elements.title.time.start.style.display="none"; vision.elements.title.time.pause.style.display="inline-block"; }
        vision.elements.title.time.pause.onclick = ()=>{ vision.elements.title.time.active=false; vision.elements.title.time.pause.style.display="none"; vision.elements.title.time.start.style.display="inline-block"; }
        vision.elements.title.time.stop.onclick = ()=>{ vision.elements.title.time.active=false; vision.elements.title.time.value=0; vision.elements.title.time.text.innerHTML="00:00"; }
        setInterval(()=>{
          if(vision.elements.title.time.active){
            vision.elements.title.time.value++;
            let hours = Math.floor(vision.elements.title.time.value / 3600);
            let minutes = Math.floor((vision.elements.title.time.value - (hours * 3600)) / 60);
            let seconds = vision.elements.title.time.value%60;
            vision.elements.title.time.text.innerHTML =( hours > 0 ? (hours<10?"0":"") + hours + ":" : "" )  + (minutes<10?"0":"")+minutes+":"+(seconds<10?"0":"")+seconds;
          }
        },1000)
        vision.elements.title.time.start.click()

//vision.elements.title.box.onclick = ()=>{vision.elements.title.box.toggle();}

//--- Zoom ---

        }
        }
        }
        }
        }
        }
      }
      }
      }
      }
    {

      let that=_temp=Asena(`<div class="bord--button--round" key="KeyW" command="@ yaklaş" style="position:absolute;right:0px;;bottom:0px;display:none;"></div>`);
      PARENT.append(that);
      that.onclick=(e)=>{
        if(e.type=="click"){
          vision.camera.zoomIn()
        }else{
          vision.camera.zoomIn(1,vision.camera.framePosition.x,vision.camera.framePosition.y)
        }
      }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<icon name="zoom_in"></icon>`);
        PARENT.append(that);
      }
      }
    {

      let that=_temp=Asena(`<div class="bord--button--round" key="KeyS" command="@ uzaklaş" style="position:absolute;right:50px;bottom:0px;display:none;"></div>`);
      PARENT.append(that);
      that.onclick=(e)=>{
        if(e.type=="click"){
          vision.camera.zoomOut()
        }else{
          vision.camera.zoomOut(1,vision.camera.framePosition.x,vision.camera.framePosition.y)
        }
      }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<icon name="zoom_out"></icon>`);
        PARENT.append(that);


//--- Subtitle , Camera, Microphone ---//
      }
      }
    {

      let that=_temp=Asena(`<div class="bord--button--round" title="Subtitle" style="position:absolute;right:0px;bottom:0px;"></div>`);
      PARENT.append(that);
      that.onclick=(e)=>{
        bord.assistant.elements.parent.toggle();
      }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<icon name="subtitle"></icon>`);
        PARENT.append(that);

      }
      }
    {

      let that=vision.elements.microphoneButton=Asena(`<div class="bord--button--round" title="Microphone" style="position:absolute;right:50px;bottom:0px;"></div>`);
      PARENT.append(that);
      that.onclick=(e)=>{ that.style.color = bord.webConnect.toggleMicrophone() ? "var(--color-2)" : null }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<icon name="microphone"></icon>`);
        PARENT.append(that);

      }
      }
    {

      let that=vision.elements.cameraButton=Asena(`<div class="bord--button--round" title="Camera" style="position:absolute;right:100px;bottom:0px;"></div>`);
      PARENT.append(that);
      that.onclick=(e)=>{ that.style.color = bord.webConnect.toggleCamera() ? "var(--color-2)" : null }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<icon name="camera"></icon>`);
        PARENT.append(that);

      }
      }
    if(location.hash=="##p" || location.hash=="##presentation"){
      {

        let that=vision.elements.nextPageButton=Asena(`<div class="bord--button--round" title="Camera" style="position:absolute;right:200px;bottom:0px;"></div>`);
        PARENT.append(that);
        that.onclick=(e)=>{ bord.presentation.next() }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<icon name="right"></icon>`);
          PARENT.append(that);

        }
        }
      {

        let that=vision.elements.previousPageButton=Asena(`<div class="bord--button--round" title="Camera" style="position:absolute;right:250px;bottom:0px;"></div>`);
        PARENT.append(that);
        that.onclick=(e)=>{ bord.presentation.previous() }
        {
        let PARENT = that;{

          let that=_temp=Asena(`<icon name="left"></icon>`);
          PARENT.append(that);
        }
        }
      }
      }
    }


//--- HideUI ---//

    {

      let that=vision.elements.toggleUI=Asena(`<div class="bord--button--round show-ui" style="position:absolute;right:50px;top:0px;background: var(--color-5);color: var(--color-1);"></div>`);
      PARENT.append(that);
      that.onclick=()=>{ bord.vision.elements.frame.classList.toggle("hide-ui") }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<icon name="toggle_ui"></icon>`);
        PARENT.append(that);


//--- FullScreen ---//
      }
      }
    {

      let that=vision.elements.fullScreenButton=Asena(`<div class="bord--button--round show-ui" key="KeyF" command="Tam Ekran" style="position:absolute;right:0px;top:0px;"></div>`);
      PARENT.append(that);
      that.onclick=()=>{
// Toogle Fullscreen
        if(document.fullscreenElement){
          document.exitFullscreen()
        }
        else{
          vision.bord.parent.requestFullscreen()
        }
      }
      {
      let PARENT = that;{

        let that=_temp=Asena(`<icon name="fullscreen"></icon>`);
        PARENT.append(that);


//-- theme for watcher --//
//@view
      }
      }
    {

      let that=vision.elements.buttonRightTheme=Asena(`<div class="bord--buttons--right" style="position:absolute;left:0px;top:50px;"></div>`);
      PARENT.append(that);
      {
      let PARENT = that;{

        let that=vision.elements.buttonTheme=Asena(`<div id="bord--button--color" class="bord--button--round" style="color: var(--color-1);background:radial-gradient(var(--backcolor-1), var(--backcolor-2), var(--backcolor-3) );"></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=_temp=Asena(`<icon name="palette"></icon>`);
          PARENT.append(that);
        }
        }
      {

        let that=_temp=Asena(`<div class="bord--buttons--container"></div>`);
        PARENT.append(that);
        var commandList=["Kara Tahta","Yeşil Tahta","Beyaz Tahta","Papirüs,Parşömen,Eski Kağıt"]
        var list = ["black","green","white","yellow"]
        for(let index in list){
          let theme = list[index]
          let style = GetStyle('.bord[theme="'+theme+'"]')
          let button;
          {
          let PARENT = that;{

            let that=button=Asena(`<div class="bord--button--round" command="${commandList[index]}" style="background: radial-gradient(${style['--backcolor-1']},${style['--backcolor-2']});"></div>`);
            PARENT.append(that);
          button.onclick=button.action=()=>{ vision.theme.set(theme) }
          }
          }
        }
//@endview


      }
      }
      }
    {

      let that=vision.elements.medias=Asena(`<div class="bord--vision--medias"></div>`);
      PARENT.append(that);
      {
      let PARENT = that;{

        let that=vision.elements.mediaCamera=Asena(`<div class="bord--vision--media-camera"></div>  `);
        PARENT.append(that);

      }
      }
    {

      let that=vision.elements.space=Asena(`<svg class="bord--vision--space" width="100" height="100" xmlns="http://www.w3.org/2000/svg"></svg>`);
      PARENT.append(that);
      {
      let PARENT = that;{

        let that=vision.elements.camera=Asena(`<g class="bord--vision--space-camera" xmlns="http://www.w3.org/2000/svg"></g>  `);
        PARENT.append(that);

      }
      }
    {

      let that=vision.elements.bord=Asena(`<svg class="bord--vision--bord" width="100" height="100" xmlns="http://www.w3.org/2000/svg"></svg>`);
      PARENT.append(that);
      {
      let PARENT = that;{

        let that=vision.elements.bordCamera=Asena(`<g class="bord--vision--bord-camera" xmlns="http://www.w3.org/2000/svg"></g>`);
        PARENT.append(that);
//vision.elements.bordTitle=<text class="bord--vision--svg--text" x="0" y="10%" fill="white" style="font-size:8em;font-weight:900" xmlns="http://www.w3.org/2000/svg">Samanyolu</text>
//vision.elements.bordText =<text class="bord--vision--svg--text" x="0" y="35%" fill="white" style="font-size:3em;font-weight:500" xmlns="http://www.w3.org/2000/svg">Galaksisi</text>
        {
        let PARENT = that;{

          let that=vision.elements.border=Asena(`<rect x="-960" y="-540" width="1920" height="1080" style="fill:transparent;stroke:#FFF;stroke-width:2;stroke-opacity:0.5;stroke-dasharray: 16;display:none" xmlns="http://www.w3.org/2000/svg"/>`);
          PARENT.append(that);

        if(location.hash=="##p" || location.hash=="##presentation"){
          vision.elements.border.style.display=null
        }


        }
        }
      }
      }
    }


    {

      let that=_=Asena(`<div key="Ctrl-KeyD" style="display:none"></div>`);
      PARENT.append(that);
      that.onclick=()=>{
        vision.duplicateDrawings()
      }


    {

      let that=_=Asena(`<div key="KeyG" style="display:none"></div>`);
      PARENT.append(that);
      that.onclick=()=>{
        console.clear();
        let element = vision.elements.camera.lastChild
        let vertices = element.v4
        let matrix = element.data.m
        let beatify = Bord.Vision.BeatifyShape(vertices ,matrix)
        if(beatify!=false){
          element.data.v = beatify
          let _points = []
          for(let i=0;i<beatify.length-2;i+=2){
            _points.push(beatify[i],beatify[i+1],beatify[i],beatify[i+1],beatify[i+2],beatify[i+3],beatify[i+2],beatify[i+3])
          }
          element.data.p = _points

          var points = Bord.Vision.Transform.ArraySplit(_points,8)
            .map(e=> Bord.Vision.Transform.ArraySplit(e,2) ) 
          element.setAttribute("d", Bord.Vision.Transform.PointsToPathData(points))

        }
//let debug_temp = Bord.Vision.Shapes.Create("polyline",{"stroke":"red","style":"stroke-width:"+vision.stroke.value+"px"})
//debug_temp.setAttribute("points",vertices.join(","))
//debug_temp.style.transform = "matrix("+matrix.join(",")+")"
//vision.elements.camera.append(debug_temp)
//setTimeout(()=>{ debug_temp.remove() },1000) 
      }
    }
    }
    }
    }
    }
    }
    }
    }
    }
    }
    }
    }
    }
    }
    }
  }


/** source\Bord\WebClass\WebClass.view  **/
/** source\Bord\WebClass\WebClass.view **/
var Bord = Bord || {};
Bord.WebClass = Bord.WebClass || {};
  Bord.WebClass.Intro = function(){
    let parent,button,modal;
    {

      let that=PARENT=parent=Asena(`<div class="bord--web-class--intro"></div>`);
      {
      let PARENT = that;{

        let that=_temp=Asena(`<label>User Name</label>`);
        PARENT.append(that);
      {

        let that=_temp=Asena(`<input type="text" placeholder="Enter your name..." value="${info.person_name}"></input>`);
        PARENT.append(that);
      {

        let that=button=Asena(`<button>Start</button>`);
        PARENT.append(that);

      button.onclick=()=>{
        Bord.WebClass.Start()
        modal.close()
      }


      }
      }
      }
      }
    modal=Bord.Components.Modal("Web Class",parent)
    button.focus()

    }
  } 


  Bord.WebClass.Medias = function(bord){
    {

      let that=PARENT=Bord.WebClass.mediasParent = Asena(`<div class="bord--web-class--medias"></div>`);
      {
      let PARENT = that;{

        let that=Bord.WebClass.medias = Asena(`<div class="bord--web-class--medias--list"></div>`);
        PARENT.append(that);
      {

        let that=Bord.WebClass.selfUser = Asena(`<div class="bord--web-class--user no-action" user-id=${info.user_id}></div>`);
        PARENT.append(that);
        {
        let PARENT = that;{

          let that=Bord.WebClass.selfUserName = Asena(`<div class="bord--web-class--user--name no-action">(Sen) ${info.person_name}</div>`);
          PARENT.append(that);

        }
        }
      }
      }
      }
    var element = Bord.WebClass.selfUser;
    element.onclick = function(e){
      if(element.classList.contains("fullscreen-media")==false){
        Array.from(document.querySelectorAll(".fullscreen-media")).forEach(e=>{
          e.classList.remove("fullscreen-media")
        })
      }
      element.classList.toggle("fullscreen-media")
      var isFullscreen = element.classList.contains("fullscreen-media")
      Bord.bord.emit("WebClass::Fullscreen", isFullscreen ? bord.webConnect.hash : 0 )
    }
    bord.vision.elements.frame.appendChild(Bord.WebClass.mediasParent)

    }
  }

  Bord.WebClass.User = function(user){
    var parent = Bord.WebClass.medias;
    var userPanel, userName;
    var userPanel = document.querySelector(`[data-hash="${user.hash}"]`)
    if(userPanel) return userPanel;
    userPanel = parent[user.hash]
    if(userPanel) return userPanel;
    {

      let that=PARENT=userPanel = Asena(`<div class="bord--web-class--user no-action" user-hash="${user.hash}" user-id=${user.id}></div>`);
      {
      let PARENT = that;{

        let that=userName = Asena(`<div class="bord--web-class--user--name no-action">${user.name}</div>`);
        PARENT.append(that);
      }
      }
    Bord.WebClass.medias.appendChild(userPanel)
    var element = userPanel;
    element.onclick = function(e){
      if(element.classList.contains("fullscreen-media")==false){
        Array.from(document.querySelectorAll(".fullscreen-media")).forEach(e=>{
          e.classList.remove("fullscreen-media")
        })
      }
      element.classList.toggle("fullscreen-media")
      var isFullscreen = element.classList.contains("fullscreen-media")
      Bord.bord.emit("WebClass::Fullscreen", isFullscreen ? user.hash : 0 )
    }
    parent[user.hash] = userPanel;
    return userPanel;
    }
  }

