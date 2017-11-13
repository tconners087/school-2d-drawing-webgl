/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell
 * 
 * 
 */


/*****
 * 
 * GLOBALS
 * 
 *****/

// 'draw_mode' are names of the different user interaction modes.
var draw_mode = {DrawLines: 0, DrawTriangles: 1, ClearScreen: 2, None: 3, DrawQuads: 4, Delete: 5};
// 'curr_draw_mode' tracks the active user interaction mode
var curr_draw_mode = draw_mode.DrawLines;

var selectedObjs = {
    objs: [],
    index: 0
}

// GL array buffers for points, lines, and triangles
// \todo Student Note: need similar buffers for other draw modes...
var vBuffer_Pnt, vBuffer_Line, vBuffer_tri, vBuffer_quad, iBuffer_quad;
//buffer for vertices of selected objects
var vBuffer_sel_Pnts;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
// \todo Student Note: need similar arrays for other draw modes...
var points = [], line_verts = [], tri_verts = [], quad_verts = [], quads = [], vPoints = [], vPointsFlattened = [];

var num_pts_line = 0;
var num_pts_tri = 0;
var num_pts_quad = 0;

var curr_selected_obj = null;


/*****
 * 
 * MAIN
 * 
 *****/
function main() {
    
    //math2d_test();
    
    /**
     **      Initialize WebGL Components
     **/
    
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShadersFromID(gl, "vertex-shader", "fragment-shader")) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // create GL buffer objects
    vBuffer_Pnt = gl.createBuffer();
    if (!vBuffer_Pnt) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_Line = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_tri = gl.createBuffer();
    if (!vBuffer_tri) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_quad = gl.createBuffer();
    if (!vBuffer_quad) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    iBuffer_quad = gl.createBuffer();
    if (!iBuffer_quad) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_sel_Pnts = gl.createBuffer();
    if (!vBuffer_sel_Pnts) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var skeleton=true;
    if(skeleton)
    {
        document.getElementById("App_Title").innerHTML += "-Skeleton";
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // get GL shader variable locations
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    /**
     **      Set Event Handlers
     **
     **  Student Note: the WebGL book uses an older syntax. The newer syntax, explicitly calling addEventListener, is preferred.
     **  See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     **/
    // set event handlers buttons
    document.getElementById("LineButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawLines;
            });

    document.getElementById("TriangleButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawTriangles;
            });    
    
    document.getElementById("ClearScreenButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.ClearScreen;
                // clear the vertex arrays
                while (points.length > 0)
                    points.pop();
                while (line_verts.length > 0)
                    line_verts.pop();
                while (tri_verts.length > 0)
                    tri_verts.pop();
                while (quad_verts.length > 0)
                    quad_verts.pop();
                while (quads.length > 0)
                    quads.pop();
                while(selectedObjs.length > 0)
                    selectedObjs.pop();
                
                //cleard so that selection vertices do not show for cleared objects
                vPoints = [];
                vPointsFlattened = [];
                curr_selected_obj = null;
                
                gl.clear(gl.COLOR_BUFFER_BIT);
                
                curr_draw_mode = draw_mode.DrawLines;
            });
            
    document.getElementById("QuadButton").addEventListener("click", function(){
        curr_draw_mode = draw_mode.DrawQuads;
    });

    document.getElementById("DeleteButton").addEventListener("click", function(){
        //Figure this out later
    });

    //document.getElementById("SelectLineButton").addEventListener("click", function(){
        //curr_draw_mode = draw_mode.None;
        //curr_select_mode = select_mode.SelectLine;
    //});

    //document.getElementById("SelectTriangleButton").addEventListener("click", function(){
        //curr_draw_mode = draw_mode.None;
        //curr_select_mode = select_mode.SelectTri;
    //});

    //\todo add event handlers for other buttons as required....            DONE

    // set event handlers for color sliders
    /* \todo right now these just output to the console, code needs to be modified... */
    document.getElementById("RedRange").addEventListener(
            "input",
            function () {
                console.log("RedRange:" + document.getElementById("RedRange").value);
            });
    document.getElementById("GreenRange").addEventListener(
            "input",
            function () {
                console.log("GreenRange:" + document.getElementById("GreenRange").value);
            });
    document.getElementById("BlueRange").addEventListener(
            "input",
            function () {
                console.log("BlueRange:" + document.getElementById("BlueRange").value);
            });                        
            
    // init sliders 
    // \todo this code needs to be modified ...
    document.getElementById("RedRange").value = 0;
    document.getElementById("GreenRange").value = 100;
    document.getElementById("BlueRange").value = 0;
            
    // Register function (event handler) to be called on a mouse press
    canvas.addEventListener(
            "mousedown",
            function (ev) {
                handleMouseDown(ev, gl, canvas, a_Position, u_FragColor);
                });
}

/*****
 * 
 * FUNCTIONS
 * 
 *****/

/*
 * Handle mouse button press event.
 * 
 * @param {MouseEvent} ev - event that triggered event handler
 * @param {Object} gl - gl context
 * @param {HTMLCanvasElement} canvas - canvas 
 * @param {Number} a_Position - GLSL (attribute) vertex location
 * @param {Number} u_FragColor - GLSL (uniform) color
 * @returns {undefined}
 */
function handleMouseDown(ev, gl, canvas, a_Position, u_FragColor) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    // Student Note: 'ev' is a MouseEvent (see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
    
    // convert from canvas mouse coordinates to GL normalized device coordinates
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    //determine which mouse button was pushed
    switch(ev.which) {
        case 1:
            //console.log("pressed LMB");
            if (curr_draw_mode !== draw_mode.None) {
                // add clicked point to 'points'
                points.push([x, y]);
            }
            // perform active drawing operation
            switch (curr_draw_mode) {
                case draw_mode.DrawLines:
                    // in line drawing mode, so draw lines
                    if (num_pts_line < 1) {			
                        // gathering points of new line segment, so collect points
                        line_verts.push([x, y]);
                        num_pts_line++;
                    }
                    else {						
                        // got final point of new line, so update the primitive arrays
                        line_verts.push([x, y]);
                        num_pts_line = 0;
                        points.length = 0;
                    }
                    break;
        
                case draw_mode.DrawTriangles:
                    if (num_pts_tri < 2){
                        tri_verts.push([x,y]);
                        num_pts_tri++;
                    } else {
                        tri_verts.push([x,y]);
                        num_pts_tri = 0;
                        points.length = 0;
                    }
                    break;
        
                case draw_mode.DrawQuads:
                    if (num_pts_quad < 3) {
                        quad_verts.push([x,y]);
                        num_pts_quad++;
                    } else {
                        quad_verts.push([x,y]);
                        //Quads are drawn as 2 triangles, so they need 6 vertices
                        quads.push(
                            quad_verts[0],
                            quad_verts[1],
                            quad_verts[2],
                            quad_verts[0],
                            quad_verts[3],
                            quad_verts[2]
                        );
                        //clear quad_verts
                        quad_verts = [];
                        
                        num_pts_quad = 0;
                        points.length = 0;
                    }
                    break;
            }
            break;
        case 2:
            console.log("pressed MMB");
            break;
        case 3:
            //console.log("pressed RMB");
            var p = new Vec2([x,y]);

            //for all possible clicked objects
            var clickedObjs = [];

            //lines
            var lines = [];
            var numLines = parseInt(line_verts.length/2); //number of fully drawn lines
            var numLinePoints = numLines * 2; //each drawn line has 2 vertices

            //triangles
            var triangles = [];
            var numTriangles = parseInt(tri_verts.length/3);
            var numTriPoints = numTriangles * 3;

            //quads
            var quad_objects = [];
            var numQuads = parseInt(quads.length/6);
            var numQuadPoints = numQuads * 6;

            //Determine if a line is close to mouse click
            for (i = 0; i < numLinePoints; i+=2) {
                var p0 = new Vec2(line_verts[i]);
                var p1 = new Vec2(line_verts[i+1]);
                var distance = pointLineDist(p0, p1, p);
                var line = {
                    objType: "LINE",
                    point0: p0,
                    point1: p1,
                    d: distance
                };
                lines.push(line);
            }
            //sort lines by distance from mouse click point
            lines.sort(function(a,b){ return a.d - b.d; });

            if (lines[0] != null && lines[0].d <= 0.025) {
                clickedObjs.push(lines[0]);
            }
            
            //if the clicked point is within a triangle
            for (i = 0; i < numTriPoints; i+=3) {
                var p0 = new Vec2(tri_verts[i]);
                var p1 = new Vec2(tri_verts[i+1]);
                var p2 = new Vec2(tri_verts[i+2]);
                var bary_coords = barycentric(p0,p1,p2,p);
                if (bary_coords[0] <= 1 && bary_coords[0] >= 0 &&
                    bary_coords[1] <= 1 && bary_coords[1] >= 0 &&
                    bary_coords[2] <= 1 && bary_coords[2] >= 0) {
                    var triangle = {
                        objType: "TRIANGLE",
                        point0: p0,
                        point1: p1,
                        point2: p2,
                        barycentric_coord: bary_coords
                    };
                    triangles.push(triangle);
                    clickedObjs.push(triangle);
                }
            }
            
            //if the clicked point is withink a quadrilateral
            for (i = 0; i < numQuadPoints; i+=6) {
                var p0 = new Vec2(quads[i]);
                var p1 = new Vec2(quads[i+1]);
                var p2 = new Vec2(quads[i+2]);
                var p3 = new Vec2(quads[i+3]);
                var p4 = new Vec2(quads[i+4]);
                var p5 = new Vec2(quads[i+5]);

                var bary_coords_1 = barycentric(p0, p1, p2, p);
                var bary_coords_2 = barycentric(p3, p4, p5, p);

                var inTriangle_1 = (bary_coords_1[0] <= 1 && bary_coords_1[0] >= 0 &&
                                    bary_coords_1[1] <= 1 && bary_coords_1[1] >= 0 &&
                                    bary_coords_1[2] <= 1 && bary_coords_1[2] >= 0);
                                    
                var inTriangle_2 = (bary_coords_2[0] <= 1 && bary_coords_2[0] >= 0 &&
                                    bary_coords_2[1] <= 1 && bary_coords_2[1] >= 0 &&
                                    bary_coords_2[2] <= 1 && bary_coords_2[2] >= 0);

                if (inTriangle_1 || inTriangle_2) {
                    //console.log("quad selected");
                    var quadrilateral = {
                        objType: "QUAD",
                        point0: p0,
                        point1: p1,
                        point2: p2,
                        point3: p3,
                        point4: p4,
                        point5: p5
                    };
                    clickedObjs.push(quadrilateral);
                } 
            }

            //Determine if currently selected objs == previously selected objs
            //if currently selected objs == previously selected objs, curr_selected_obj is assigned the next obj
            if (clickedObjs.length != 0) {
                if (clickedObjs.length == selectedObjs.objs.length) {
                    var different = false;
                    //if any element in the new array is different than old array
                    for(i = 0; i < clickedObjs.length; i++) {
                        if (clickedObjs[i].objType == selectedObjs.objs[i].objType){

                            if (clickedObjs[i].objType == "TRIANGLE" && selectedObjs.objs[i].objType == "TRIANGLE") {
                            //create objects to compare that don't include the barycentric coordinates of the selected point

                                var iTri = {
                                    p0: clickedObjs[i].point0,
                                    p1: clickedObjs[i].point1,
                                    p2: clickedObjs[i].point2
                                };

                                var sTri = {
                                    p0: selectedObjs.objs[i].point0,
                                    p1: selectedObjs.objs[i].point1,
                                    p2: selectedObjs.objs[i].point2
                                };

                                if (JSON.stringify(iTri)!=JSON.stringify(sTri))
                                    different = true;
                            }

                            if (clickedObjs[i].objType == "LINE" && selectedObjs.objs[i].objType == "LINE") {

                                var iLine = {
                                    p0: clickedObjs[i].point0,
                                    p1: clickedObjs[i].point1
                                };

                                var sLine = {
                                    p0: selectedObjs.objs[i].point0,
                                    p1: selectedObjs.objs[i].point1
                                };

                                if (JSON.stringify(iLine)!=JSON.stringify(sLine))
                                    different = true;
                            }

                            if(clickedObjs[i].objType == "QUAD" && selectedObjs.objs[i].objType == "QUAD") {
                                if (JSON.stringify(clickedObjs[i])!=JSON.stringify(selectedObjs.objs[i]))
                                    different = true;
                            }

                        } else {
                            different = true;
                        }
                    }
                    if (different) {
                        //console.log("new object arrangment selected");
                        selectedObjs.objs = [];
                        for(i = 0; i < clickedObjs.length; i++) {
                            selectedObjs.objs.push(clickedObjs[i]);
                        }
                        selectedObjs.index = 0;
                    } else {
                        //console.log("Same objects selected.");
                        //console.log("previous index: " + selectedObjs.index);
                        selectedObjs.index += 1;
                        if (selectedObjs.index > selectedObjs.objs.length - 1) {
                            selectedObjs.index = 0;
                        }
                        //console.log("new index: " + selectedObjs.index);
                    }
                } else {
                    //console.log("new object arrangement selected");
                    selectedObjs.objs = [];
                    for(i = 0; i < clickedObjs.length; i++) {
                        selectedObjs.objs.push(clickedObjs[i]);
                    }
                    selectedObjs.index = 0;
                }
                curr_selected_obj=selectedObjs.objs[selectedObjs.index];
            } else {
                //console.log("no objects selected");
            }

            break;
        default:
            break;
    }

    
    
    drawObjects(gl,a_Position, u_FragColor);
}

/*
 * Draw all objects
 * @param {Object} gl - WebGL context
 * @param {Number} a_Position - position attribute variable
 * @param {Number} u_FragColor - color uniform variable
 * @returns {undefined}
 */
function drawObjects(gl, a_Position, u_FragColor) {

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw lines
    if (line_verts.length) {	
        // enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(line_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 1.0);
        // draw the lines
        gl.drawArrays(gl.LINES, 0, line_verts.length );
    }

    //Draw triangles
    if (tri_verts.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_tri);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(tri_verts), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, tri_verts.length);
    }

    //Draw Quads
    if (quads.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_quad);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(quads), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, quads.length);
    }

    //Draw vertices of selected object
    if (curr_selected_obj) {
        vPoints = [];
        vPointsFlattened = [];
        
        if(curr_selected_obj.objType == "LINE") {
            vPoints.push(curr_selected_obj.point0.array);
            vPoints.push(curr_selected_obj.point1.array);
        }

        if(curr_selected_obj.objType == "TRIANGLE") {
            vPoints.push(curr_selected_obj.point0.array);
            vPoints.push(curr_selected_obj.point1.array);
            vPoints.push(curr_selected_obj.point2.array);
        }

        if(curr_selected_obj.objType == "QUAD") {
            vPoints.push(curr_selected_obj.point0.array);
            vPoints.push(curr_selected_obj.point1.array);
            vPoints.push(curr_selected_obj.point2.array);
            vPoints.push(curr_selected_obj.point4.array);
        }

        for (i = 0; i < vPoints.length; i++) {
            vPointsFlattened.push(vPoints[i][0]);
            vPointsFlattened.push(vPoints[i][1]);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_sel_Pnts);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vPointsFlattened), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0);
        gl.drawArrays(gl.POINTS, 0, vPoints.length);    
    }
    
    // draw primitive creation vertices 
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    gl.drawArrays(gl.POINTS, 0, points.length);    
}

/**
 * Converts 1D or 2D array of Number's 'v' into a 1D Float32Array.
 * @param {Number[] | Number[][]} v
 * @returns {Float32Array}
 */
function flatten(v)
{
    var n = v.length;
    var elemsAreArrays = false;

    if (Array.isArray(v[0])) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array(n);

    if (elemsAreArrays) {
        var idx = 0;
        for (var i = 0; i < v.length; ++i) {
            for (var j = 0; j < v[i].length; ++j) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for (var i = 0; i < v.length; ++i) {
            floats[i] = v[i];
        }
    }

    return floats;
}
