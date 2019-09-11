AFRAME.registerComponent('rotation-ctrl', {

  tick: (function () {
    var rotation = cam.object3D.rotation;
    var limit = PI/4;
    rotation.y = -PI/2;
    if (rotation.x > +limit) rotation.x = +limit;
    if (rotation.x < -limit) rotation.x = -limit;
  })

});
