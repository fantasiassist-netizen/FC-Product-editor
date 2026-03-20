const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let layers = [];
let selectedLayer = null;

// UNDO / REDO
let history = [];
let redoStack = [];

// PRODUCTS (ADD MORE HERE 🔥)
const products = [
  {
    name: "Shoelace Tag",
    src: "https://fantasiassist-netizen.github.io/FC-Product-editor/ShoelaceFlexTagBlank.png"
  },
  {
    name: "Alt Product",
    src: "https://via.placeholder.com/500x600"
  }
];

let productImage = new Image();

// LOAD PRODUCT DROPDOWN
const productSelect = document.getElementById("productSelect");
products.forEach((p, i) => {
  let opt = document.createElement("option");
  opt.value = i;
  opt.textContent = p.name;
  productSelect.appendChild(opt);
});

productSelect.onchange = () => loadProduct(productSelect.value);

function loadProduct(index) {
  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = function () {
    productImage = img;
    draw();
  };

  img.src = products[index].src;
}

productImage.onload = draw;
loadProduct(0);

// SAVE STATE
function saveState() {
  history.push(JSON.stringify(layers));
  redoStack = [];
}

// UNDO / REDO
function undo() {
  if (history.length > 0) {
    redoStack.push(JSON.stringify(layers));
    layers = JSON.parse(history.pop());
    draw();
  }
}

function redo() {
  if (redoStack.length > 0) {
    history.push(JSON.stringify(layers));
    layers = JSON.parse(redoStack.pop());
    draw();
  }
}

// ADD TEXT
function addText() {
  saveState();
  const layer = {
    type: "text",
    text: "Text",
    x: 200,
    y: 300,
    size: 40,
    rotation: 0,
    color: "#ffffff",
    outline: "#000000",
    outlineWidth: 2,
    font: "Arial"
  };
  layers.push(layer);
  selectedLayer = layer;
  updateUI();
}

// ADD LOGO
function addLogo() {
  document.getElementById("upload").click();
}

// DELETE
function deleteLayer() {
  if (!selectedLayer) return;
  saveState();
  layers = layers.filter(l => l !== selectedLayer);
  selectedLayer = null;
  updateUI();
}

// UPLOAD IMAGE
document.getElementById("upload").addEventListener("change", e => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    let img = new Image();
    img.onload = () => {
      saveState();
      const layer = {
        type: "image",
        img: img,
        x: 150,
        y: 200,
        w: 120,
        h: 120,
        rotation: 0
      };
      layers.push(layer);
      selectedLayer = layer;
      updateUI();
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

// DRAW
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(productImage, 0, 0, canvas.width, canvas.height);

  layers.forEach(layer => {
    ctx.save();

    ctx.translate(layer.x, layer.y);
    ctx.rotate(layer.rotation * Math.PI / 180);

    if (layer.type === "text") {
      ctx.font = layer.size + "px " + layer.font;
      ctx.lineWidth = layer.outlineWidth;
      ctx.strokeStyle = layer.outline;
      ctx.strokeText(layer.text, 0, 0);

      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, 0, 0);
    }

    if (layer.type === "image") {
      ctx.drawImage(layer.img, -layer.w/2, -layer.h/2, layer.w, layer.h);
    }

    ctx.restore();
  });
}

// UI
function updateUI() {
  const list = document.getElementById("layers");
  list.innerHTML = "";

  layers.forEach((l,i)=>{
    let div = document.createElement("div");
    div.className = "layer-item " + (l===selectedLayer?"active":"");
    div.innerText = l.type + " " + (i+1);
    div.onclick = ()=>{selectedLayer=l; updateUI();}
    list.appendChild(div);
  });

  draw();
}

// CONTROLS
document.getElementById("textInput").oninput = e=>{
  if(selectedLayer?.type==="text"){ selectedLayer.text=e.target.value; draw();}
};

document.getElementById("fontSelect").onchange = e=>{
  if(selectedLayer?.type==="text"){ selectedLayer.font=e.target.value; draw();}
};

document.getElementById("textColor").oninput = e=>{
  if(selectedLayer?.type==="text"){ selectedLayer.color=e.target.value; draw();}
};

document.getElementById("size").oninput = e=>{
  if(selectedLayer?.type==="text"){ selectedLayer.size=e.target.value; draw();}
};

document.getElementById("rotation").oninput = e=>{
  if(selectedLayer){ selectedLayer.rotation=e.target.value; draw();}
};

document.getElementById("outlineColor").oninput = e=>{
  if(selectedLayer?.type==="text"){ selectedLayer.outline=e.target.value; draw();}
};

document.getElementById("outlineWidth").oninput = e=>{
  if(selectedLayer?.type==="text"){ selectedLayer.outlineWidth=e.target.value; draw();}
};

// DRAG
let offsetX, offsetY;

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // detect clicked layer (top first)
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];

    if (l.type === "text") {
      if (
        x > l.x - 50 &&
        x < l.x + 50 &&
        y > l.y - 50 &&
        y < l.y + 50
      ) {
        selectedLayer = l;
        offsetX = x - l.x;
        offsetY = y - l.y;
        dragging = true;
        updateUI();
        return;
      }
    }

    if (l.type === "image") {
      if (
        x > l.x - l.w / 2 &&
        x < l.x + l.w / 2 &&
        y > l.y - l.h / 2 &&
        y < l.y + l.h / 2
      ) {
        selectedLayer = l;
        offsetX = x - l.x;
        offsetY = y - l.y;
        dragging = true;
        updateUI();
        return;
      }
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragging || !selectedLayer) return;

  const rect = canvas.getBoundingClientRect();
  selectedLayer.x = e.clientX - rect.left - offsetX;
  selectedLayer.y = e.clientY - rect.top - offsetY;

  draw();
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
});

// DOWNLOAD
function download(){
  let link=document.createElement("a");
  link.download="design.png";
  link.href=canvas.toDataURL();
  link.click();
}
