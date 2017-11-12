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

var select_mode = {SelectLine: 0, SelectTri: 1, None: 2};
var curr_select_mode = select_mode.None;

// GL array buffers for points, lines, and triangles
// \todo Student Note: need similar buffers for other draw modes...
var vBuffer_Pnt, vBuffer_Line, vBuffer_tri, vBuffer_quad, iBuffer_quad;
//buffer for vertices of selected objects
var vBuffer_sel_Pnts;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
// \todo Student Note: need similar arrays for other draw modes...
var points = [], line_verts = [], tri_verts = [], quad_verts = [], quads = [];

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

    // \todo create buffers for triangles and quads... DONE

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
                curr_select_mode = select_mode.None;
            });

    document.getElementById("TriangleButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawTriangles;
                curr_select_mode = select_mode.None;
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

                gl.clear(gl.COLOR_BUFFER_BIT);
                
                curr_draw_mode = draw_mode.DrawLines;
                curr_select_mode = select_mode.None;
            });
            
    document.getElementById("QuadButton").addEventListener("click", function(){
        curr_draw_mode = draw_mode.DrawQuads;
    });

    document.getElementById("DeleteButton").addEventListener("click", function(){
        //Figure this out later
    });

    document.getElementById("SelectLineButton").addEventListener("click", function(){
        curr_draw_mode = draw_mode.None;
        curr_select_mode = select_mode.SelectLine;
    });

    document.getElementById("SelectTriangleButton").addEventListener("click", function(){
        curr_draw_mode = draw_mode.None;
        curr_select_mode = select_mode.SelectTri;
    });

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

    switch(curr_select_mode) {
        case select_mode.SelectLine:
            var p = new Vec2([x, y]);
            var lines = []; //array for storing drawn lines
            var numLines = parseInt(line_verts.length/2); //number of fully drawn lines
            var numPoints = numLines * 2; //each drawn line has 2 vertices
            for (i = 0; i < numPoints; i+=2) {
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
            //if the closest_line (lines[0]) to clicked point is sufficiently 
            //close to clicked point, curr_selected_object = closest_line.
            //else, curr_selected_obj = null
            if (lines[0] != null && lines[0].d <= 0.025) {
                curr_selected_obj = lines[0];
            } else {
                curr_selected_obj = null;
            }
            
        break;

        case select_mode.SelectTri:
            var p = new Vec2([x,y]);
            var triangles = [];
            var numTriangles = parseInt(tri_verts.length/3);
            var numPoints = numTriangles * 3;
            for (i = 0; i < numPoints; i+=3) {
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
                }
            }
            if (triangles) {
                console.log(triangles[0].barycentric_coord);
            }
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
        var vPoints = [];
        var vPointsFlattened = [];
        
        if(curr_selected_obj.objType == "LINE") {
            vPoints.push(curr_selected_obj.point0.array);
            vPoints.push(curr_selected_obj.point1.array);
        }

        for (i = 0; i < vPoints.length; i++) {
            vPointsFlattened.push(vPoints[i][0]);
            vPointsFlattened.push(vPoints[i][1]);
        }

        vPointsFlattened = flatten(vPointsFlattened);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_sel_Pnts);
        gl.bufferData(gl.ARRAY_BUFFER, vPointsFlattened, gl.STATIC_DRAW);
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
