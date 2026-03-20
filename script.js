const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let layers = [];
let selectedLayer = null;

let history = [];
let redoStack = [];

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
  img.onload = ()=>{ productImage = img; draw(); };
  img.src = products[i].src;
}
loadProduct(0);

// SAVE STATE
function saveState(){
  history.push(JSON.stringify(layers));
  redoStack = [];
}

// UNDO / REDO
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
    size:40,
    rotation:0,
    color:"#000"
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
  ctx.drawImage(productImage,0,0,canvas.width,canvas.height);

  layers.forEach(layer=>{
    ctx.save();
    ctx.translate(layer.x,layer.y);
    ctx.rotate(layer.rotation*Math.PI/180);

    if(layer.type==="text"){
      ctx.font = layer.size+"px Arial";
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text,0,0);
    }

    if(layer.type==="image"){
      ctx.drawImage(layer.img,-layer.w/2,-layer.h/2,layer.w,layer.h);
    }

    // BOUNDING BOX
    if(layer===selectedLayer){
      ctx.strokeStyle="blue";
      ctx.strokeRect(-60,-60,120,120);

      // resize handle
      ctx.fillStyle="blue";
      ctx.fillRect(50,50,10,10);

      // rotate handle
      ctx.fillStyle="red";
      ctx.fillRect(0,-80,10,10);
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

// DRAG / RESIZE / ROTATE
let mode=null;

canvas.onmousedown=e=>{
  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  if(!selectedLayer) return;

  // resize zone
  if(x>selectedLayer.x+50 && y>selectedLayer.y+50){
    mode="resize";
    return;
  }

  // rotate zone
  if(y<selectedLayer.y-60){
    mode="rotate";
    return;
  }

  mode="drag";
};

canvas.onmousemove=e=>{
  if(!mode || !selectedLayer) return;

  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  if(mode==="drag"){
    selectedLayer.x=x;
    selectedLayer.y=y;
  }

  if(mode==="resize" && selectedLayer.type==="image"){
    selectedLayer.w+=2;
    selectedLayer.h+=2;
  }

  if(mode==="rotate"){
    selectedLayer.rotation+=2;
  }

  draw();
};

canvas.onmouseup=()=> mode=null;

// SEND TO WIX
function sendToCart(){
  const image = canvas.toDataURL("image/png");

  window.parent.postMessage({
    type:"CUSTOM_PRODUCT",
    design: layers,
    preview: image
  },"*");

  alert("Design sent!");
}
