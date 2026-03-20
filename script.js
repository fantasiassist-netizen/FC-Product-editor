const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let layers = [];
let selectedLayer = null;

let history = [];
let redoStack = [];

let productColor = "#ffffff";
let productRotation = 0;

const products = [
{
  name: "Shoelace Tag",
  src: "https://fantasiassist-netizen.github.io/FC-Product-editor/ShoelaceFlexTagBlank.png"
}
];

let productImage = new Image();

// LOAD PRODUCTS
const select = document.getElementById("productSelect");
products.forEach((p,i)=>{
  let opt = document.createElement("option");
  opt.value=i;
  opt.textContent=p.name;
  select.appendChild(opt);
});

select.onchange = ()=> loadProduct(select.value);

function loadProduct(i){
  const img = new Image();
  img.crossOrigin="anonymous";

  img.onload = ()=>{
    productImage = img;
    draw();
  };

  img.src = products[i].src;
}
loadProduct(0);

// CONTROLS
document.getElementById("productColor").oninput = e=>{
  productColor = e.target.value;
  draw();
};

document.getElementById("productRotation").onchange = e=>{
  productRotation = parseInt(e.target.value);
  draw();
};

// SAVE
function saveState(){
  history.push(JSON.stringify(layers));
  redoStack = [];
}

// UNDO REDO
function undo(){
  if(history.length){
    redoStack.push(JSON.stringify(layers));
    layers = JSON.parse(history.pop());
    draw();
  }
}

function redo(){
  if(redoStack.length){
    history.push(JSON.stringify(layers));
    layers = JSON.parse(redoStack.pop());
    draw();
  }
}

// ADD TEXT
function addText(){
  saveState();
  const layer = {
    type:"text",
    text:"Text",
    x:250,y:300,
    size:200,
    rotation:0,
    color:"#000",
    outline:"#000",
    outlineWidth:2,
    font:"Anton"
  };
  layers.push(layer);
  selectedLayer=layer;
  updateUI();
}

// ADD IMAGE
function addLogo(){
  document.getElementById("upload").click();
}

document.getElementById("upload").onchange = e=>{
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = evt=>{
    let img = new Image();
    img.onload = ()=>{
      saveState();
      const layer = {
        type:"image",
        img:img,
        x:250,y:300,
        w:120,h:120,
        rotation:0
      };
      layers.push(layer);
      selectedLayer=layer;
      updateUI();
    };
    img.src = evt.target.result;
  };

  reader.readAsDataURL(file);
};

// DELETE
function deleteLayer(){
  if(!selectedLayer) return;
  saveState();
  layers = layers.filter(l=>l!==selectedLayer);
  selectedLayer=null;
  updateUI();
}

// DRAW
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.save();

  if(productRotation !== 0){
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(productRotation*Math.PI/180);
    ctx.drawImage(productImage,-canvas.height/2,-canvas.width/2,canvas.height,canvas.width);
  } else {
    ctx.drawImage(productImage,0,0,canvas.width,canvas.height);
  }

  ctx.restore();

  // COLOR OVERLAY
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = productColor;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation = "source-over";

  layers.forEach(layer=>{
    ctx.save();

    ctx.translate(layer.x,layer.y);
    ctx.rotate(layer.rotation*Math.PI/180);

    if(layer.type==="text"){
      ctx.font = layer.size+"px '"+layer.font+"'";

      ctx.lineWidth = layer.outlineWidth;
      ctx.strokeStyle = layer.outline;
      ctx.strokeText(layer.text,0,0);

      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text,0,0);
    }

    if(layer.type==="image"){
      ctx.drawImage(layer.img,-layer.w/2,-layer.h/2,layer.w,layer.h);

      // resize handle
      if(layer===selectedLayer){
        ctx.fillStyle="blue";
        ctx.fillRect(layer.w/2-5,layer.h/2-5,10,10);
      }
    }

    ctx.restore();
  });
}

// UI
function updateUI(){
  const list=document.getElementById("layers");
  list.innerHTML="";

  layers.forEach((l,i)=>{
    let div=document.createElement("div");
    div.className="layer-item "+(l===selectedLayer?"active":"");
    div.innerText=l.type+" "+(i+1);
    div.onclick=()=>{selectedLayer=l; updateUI();}
    list.appendChild(div);
  });

  draw();
}

// CONTROLS
document.getElementById("textInput").oninput=e=>{
  if(selectedLayer?.type==="text"){
    selectedLayer.text=e.target.value;
    draw();
  }
};

document.getElementById("fontSelect").onchange=e=>{
  if(selectedLayer?.type==="text"){
    selectedLayer.font=e.target.value;
    draw();
  }
};

document.getElementById("textColor").oninput=e=>{
  if(selectedLayer?.type==="text"){
    selectedLayer.color=e.target.value;
    draw();
  }
};

document.getElementById("size").oninput=e=>{
  if(selectedLayer?.type==="text"){
    selectedLayer.size=e.target.value;
    draw();
  }
};

document.getElementById("rotation").oninput=e=>{
  if(selectedLayer){
    selectedLayer.rotation=e.target.value;
    draw();
  }
};

document.getElementById("outlineColor").oninput=e=>{
  if(selectedLayer?.type==="text"){
    selectedLayer.outline=e.target.value;
    draw();
  }
};

document.getElementById("outlineWidth").oninput=e=>{
  if(selectedLayer?.type==="text"){
    selectedLayer.outlineWidth=e.target.value;
    draw();
  }
};

// DRAG
let dragging=false;

canvas.onmousedown=()=>dragging=true;
canvas.onmouseup=()=>dragging=false;

canvas.onmousemove=e=>{
  if(dragging && selectedLayer){
    const rect=canvas.getBoundingClientRect();
    selectedLayer.x=e.clientX-rect.left;
    selectedLayer.y=e.clientY-rect.top;
    draw();
  }
};

// SEND
function sendToCart(){
  const image = canvas.toDataURL("image/png");

  window.parent.postMessage({
    type:"CUSTOM_PRODUCT",
    preview:image,
    layers:layers
  },"*");

  alert("Design sent!");
}
