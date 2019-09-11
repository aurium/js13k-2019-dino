const DEBUG = !!document.location.href.match(/debug/);
var round = Math.round;
var rnd = Math.random;
var random = (min, max)=> max ? rnd() * (max-min) + min : rnd() * min;
var abs = Math.abs;
var PI = Math.PI;
var cactus = [];
var log = (...args)=> DEBUG && console.log(...args);
var lifeBarLineLength = lifeBar.getObject3D('line__length');
var lifeBarLinePct = lifeBar.getObject3D('line__pct');
var distanceInc = 0;

lifeBarLineLength.material.linewidth = 22;
lifeBarLinePct.material.linewidth = 20;

var mk = function mk(type, attrs, parent) {
  var el = document.createElement('a-'+type);
  for (var att in attrs) el.setAttribute(att, attrs[att]);
  if (parent) parent.appendChild(el);
  else scene.appendChild(el);
  return el;
}
HTMLElement.prototype.mk = function (type, attrs) {
  return mk(type, attrs, this);
}
HTMLElement.prototype.selfRemove = function () {
  this.parentNode.removeChild(this);
}

// Draw or get stars image data
function getStarsData(ctx, w, h) {
  if (getStarsData.data) return getStarsData.data;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0, w,h);
  var x, y, rv = 1; // vertical radius;
  ctx.fillStyle='#FFF';
  for (y=rv*3; y<(h-rv*3); y+=rv*2) {
    ctx.beginPath();
    var vStep = abs(y-(h/2))/(h/2);
    var rh = rv+w*(.001*Math.asin(vStep)**10); // horizontal radius;
    for (x=rh*2; x<(w-rh*2); x+=rh*2) {
      if (rnd()<.01) {
        let incR = rnd()+.5;
        ctx.ellipse(x,y, rh*incR,rv*incR, 0, 0,2*PI);
      }
    }
    ctx.fill();
  }
  return getStarsData.data = ctx.getImageData(0, 0, w, h);
}

// Draw Sky pattern
(()=> {
  var w = cSky.width = 2000;
  var h = cSky.height = 1000;
  var ctx = cSky.getContext('2d');
  ctx.putImageData(getStarsData(ctx, w, h), 0, 0);
  var grad = ctx.createLinearGradient(0,0, 0,h);
  grad.addColorStop(0.00, 'rgba(255,255,255, 1)');
  grad.addColorStop(0.12, 'rgba(255,255,255, 0)');
  grad.addColorStop(0.30, 'rgba(  0,  0,200, 0)');
  grad.addColorStop(0.60, 'rgba(  0,100,200, 1)');
  grad.addColorStop(0.85, 'rgba(  0,128,255, 1)');
  grad.addColorStop(1.00, 'rgba(255,255,255, 1)');
  ctx.fillStyle = grad;
  //ctx.fillRect(0,0, w,h);
  
  for (let i=0; i<5; i++) {
    ctx.beginPath();
    let vale = h/2+(i-1)*(h/15);
    let cume = h/2+(i-5)*(h/15);
    ctx.moveTo(0, vale);
    ctx.bezierCurveTo(w*.25, vale,  w*.25 ,cume,  w*.5, cume)
    ctx.bezierCurveTo(w*.75, cume,  w*.75, vale,  w, vale)
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.fillStyle = (i==4) ? '#08F' : `rgba(0,128,255,${i*.2})`;
    ctx.fill();
  }
  ctx.fillStyle = '#999';
  ctx.fillRect(0,0, w,h*.07);
  ctx.fillStyle = '#FE0';
  ctx.fillRect(0,h*.93, w,h);
  //ctx.fillStyle = 'rgba(255,0,0,.3)';
  //ctx.fillRect(0,h/2, w,h);
})();


function init() {
  log('Game init.');
  floor.components.animation.config.loopComplete = ()=> {
    distanceInc += 5000;
    log('Animation Loop Complete. distanceInc: ' + distanceInc);
  };

  // User must call it:
  setTimeout(()=> floor.dispatchEvent(new Event('start')), 2000);
}

scene.addEventListener('loaded', init);

function tic() {
  var origRot = sky.object3D.rotation.z;
  var rot = (origRot>PI ? origRot-2*PI : origRot) / PI;
  var absRot = abs(rot);
  if (absRot > .38  && absRot < .4) {
    ambientLight.setAttribute('color', `rgb(0,0,255)`);
  } else if (absRot > .38  && absRot < .6) {
    let light = round(255 * (absRot-.4)/.2);
    ambientLight.setAttribute('color', `rgb(${light},${light},255)`);
  } else if (absRot > .38  && absRot < .62) {
    ambientLight.setAttribute('color', `rgb(255,255,255)`);
  }
  var intensity = (rot < 0)
      ? (rot <-.8 ? .5-((1+rot)*2.5) : 0) // anoitecer
      : (rot < .5 ? rot**2*2 : .5); // amanhecer
  sunLight.setAttribute('intensity', intensity);
  ambientLight.setAttribute('intensity', intensity+.3);
  var posX = -floor.object3D.position.x;
  placeCactus(round(posX), true);
  var dist = round((5000 - floor.object3D.position.x + distanceInc)/10).toString(); // Kilometers
  while (dist.length < 3) dist = '0' + dist;
  dist = dist.match(/^(.*)(..)$/);
  odometerI.setAttribute('value', dist[1]);
  odometerD.setAttribute('value', '.'+dist[2]);
}
setInterval(tic, 33);

// Draw floor texture:
(()=> {
  var w = cFloor.width = 512;
  var h = cFloor.height = 512;
  var ctx = cFloor.getContext('2d');
  ctx.fillStyle = '#DB7';
  ctx.fillRect(0,0, w,h);
  for (let x=4; x<w; x+=8) for (let y=4; y<h; y+=8) {
    ctx.beginPath();
    ctx.arc(random(x-2,x+2), random(y-2,y+2), 3, 0, 2*PI);
    ctx.fillStyle = rnd()<.5 ? '#CA6' : '#EC8';
    ctx.fill();
  }
})()

// Make and place one cactus:
function mkCactus(x, z, height, radius) {
  var color = '#0B0';
  zNoize = z==0 ? random(-.6, .6) : z + random(-10, 10);
  var rotation = rnd()<.5 ? random(-80,-100) : random(80,100);
  var g = mk('entity', {position:`${x} 0 ${zNoize}`, rotation:`0 ${rotation} 0`, height, radius, color}, floor)
  mk('cylinder', {position:`0 ${height/2} 0`, height, radius:radius*1.25, color}, g)
  mk('cylinder', {position:`-${height/6} ${height*.6} 0`, rotation:'0 0 90', height:height/3, radius, color}, g)
  mk('cylinder', {position:`+${height/6} ${height*.5} 0`, rotation:'0 0 90', height:height/3, radius, color}, g)
  mk('cylinder', {position:`-${height/3} ${height*.7333} 0`, height:height/4, radius, color}, g)
  mk('cylinder', {position:`+${height/3} ${height*.6666} 0`, height:height/3, radius, color}, g)
  mk('sphere', {position:`0 ${height} 0`, radius:radius*1.25, color}, g)
  mk('sphere', {position:`-${height/3} ${height*.8666} 0`, radius, color}, g)
  mk('sphere', {position:`-${height/3} ${height*.6} 0`, radius, color}, g)
  mk('sphere', {position:`+${height/3} ${height*.8333} 0`, radius, color}, g)
  mk('sphere', {position:`+${height/3} ${height*.5} 0`, radius, color}, g)
  g.baseRotation = rotation
  g.baseZ = z
  cactus.push({x, z, g})
}

// Randomly may place cactus in front of the user, preparing the scene:
var lastIniX = null
function placeCactus(iniX, mustClean) {
  if (iniX != lastIniX) {
    //log(iniX, mustClean, cactus.length)
    lastIniX = iniX;
    var newX = iniX + 120;
    if (rnd()<.1) { // Paisage cactus
      var rndZ = random(10, 100);
      if (rnd()<.5) rndZ *= -1;
      mkCactus(newX, rndZ, random(1.7,2.2), random(.15,.22));
    }
    // Obstaculo:
    if (rnd()<.04) mkCactus(newX, 0, random(1.7,2.2), random(.15,.22));
    // Prepare floor repeat animation:
    if (iniX > -120) placeCactus(iniX-5000);
    // Clean past cactus:
    cactus = cactus.filter((c)=> {
      if ( mustClean && (
           (c.x < iniX-1 && c.x > iniX-1000) ||
           (iniX < -4990 && c.x > -1000) ) ) {
        c.g.parentNode.removeChild(c.g);
        return false;
      }
      else return true;
    });
  }
}

for (let x=0; x>-110; x--) placeCactus(x-5000);

// Place mountains
(()=> {
  for (let x=0; x<4900; x+=600) {
    let radius = random(150, 330);
    let rY = random(0, 360);
    let z = random(300, 2000) * (rnd()<.5 ? -1 : 1);
    mk('icosahedron', {position:`${x} 0 ${z}`, radius,
                       color:'#DB7', rotation:`0 ${rY} 0`}, floor)
    mk('icosahedron', {position:`${x-5000} 0 ${z}`, radius,
                       color:'#DB7', rotation:`0 ${rY} 0`}, floor)
    mk('sphere', {position:`${x} ${-radius*.3} ${-z}`, radius, color:'#DB7',
                 'segments-height':5, 'segments-width':5, rotation:'90 0 0'}, floor)
    mk('sphere', {position:`${x-5000} ${-radius*.3} ${-z}`, radius, color:'#DB7',
                 'segments-height':5, 'segments-width':5, rotation:'90 0 0'}, floor)
  }
})();


function plotPix(x, y, z, width=1, height=1, depth=1) {
  width/=10; height/=10; depth/=10;
  x = ( x - data[0].length/2 ) / 10;
  y = ( y - data.length) / -10;
  var color = '#'+ round(random(150,180)).toString(16) + round(random(10,30)) + round(random(50,70));
  mk('box', {position:`${x} ${y} ${z}`, width, height, depth, color}, dino);
}

data = [
  '           ####    ',
  '          ### #####',
  '          #########',
  '          #########',
  '          #####    ',
  '          ######## ',
  '         ####      ',
  '#       #####      ',
  '#      ########    ',
  '##    ####### #    ',
  '###  ########      ',
  '#############      ',
  ' ############      ',
  '  ##########       ',
  '   #########       ',
  '    #### ##        ',
  '     ##   #        ',
  '     #    #        ',
  '     ##   ##       '
]
data.forEach((line, y)=>
  line.split('').forEach((pix, x)=>
    0//(pix == '#') ? plotPix(x, y, 0) : null
  )
)

if (DEBUG) {
  scene.setAttribute('stats', true);
}
