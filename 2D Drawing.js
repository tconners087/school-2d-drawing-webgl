/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell, Taylor Conners
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

var selected_type = {line: 0, triangle: 1, quad: 2};
var curr_selected_type = selected_type.line;

var selectedObjs = {
    objs: [],
    index: 0
}

// GL array buffers for points, lines, and triangles
var vBuffer_Pnt, vBuffer_Line, vBuffer_tri, vBuffer_quad, iBuffer_quad;
//buffer for vertices of selected objects
var vBuffer_sel_Pnts;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
var points = [], line_verts = [], tri_verts = [], quad_verts = [], quads = [], vPoints = [], vPointsFlattened = [];

var num_pts_line = 0;
var num_pts_tri = 0;
var num_pts_quad = 0;

var curr_selected_obj = null;

var rgba_arr_line = [0.0,1.0,0.0,1.0];
var rgba_arr_tri = [1.0,0.0,0.0,1.0];
var rgba_arr_quad = [1.0,0.0,1.0,1.0];
var rgba_arrays = [rgba_arr_line, rgba_arr_tri, rgba_arr_quad];
var index = 0;

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
    
    switch(curr_selected_type) {
        case selected_type.line:
            index = 0;
        break;

        case selected_type.tri:
            index = 1;
        break;

        case selected_type.quad:
            index = 2;
        break;
    }

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    //var gl = canvas.getContext('webgl');
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
        document.getElementById("App_Title").innerHTML += "-Taylor Conners";
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
        if (curr_selected_obj) {
            //If selected object is a line, remove its vertices from line_verts
            if (curr_selected_obj.objType == "LINE") {
                for (i = 0; i < line_verts.length; i ++){
                    var temp = new Vec2(line_verts[i]).array;
                    var matchP0 = (curr_selected_obj.point0.array[0] == temp[0] &&
                                    curr_selected_obj.point0.array[1] == temp[1]);

                    var matchP1 = (curr_selected_obj.point1.array[0] == temp[0] &&
                                    curr_selected_obj.point1.array[1] == temp[1]);

                    if (matchP0 || matchP1){
                        if (line_verts.length == 1) {
                            line_verts = [];
                        } else {
                            line_verts.splice(i, 1);
                        }
                        i = -1;
                    }
                }
            }
            //if selected object is a triangle, remove its vertices from tri_verts
            if (curr_selected_obj.objType == "TRIANGLE") {
                for (i = 0; i < tri_verts.length; i++){
                    var temp = new Vec2(tri_verts[i]).array;
                    var matchP0 = (curr_selected_obj.point0.array[0] == temp[0] &&
                        curr_selected_obj.point0.array[1] == temp[1]);

                    var matchP1 = (curr_selected_obj.point1.array[0] == temp[0] &&
                        curr_selected_obj.point1.array[1] == temp[1]);

                    var matchP2 = (curr_selected_obj.point2.array[0] == temp[0] &&
                        curr_selected_obj.point2.array[1] == temp[1]);

                    if (matchP0 || matchP1 || matchP2) {
                        if (tri_verts.length == 1)
                            tri_verts = [];
                        else
                            tri_verts.splice(i, 1);
                        i = -1;
                    }
                }
            }
            if (curr_selected_obj.objType == "QUAD") {
                for (i = 0; i < quads.length; i++){
                    var temp = new Vec2(quads[i]).array;
                    var matchP0 = (curr_selected_obj.point0.array[0] == temp[0] &&
                        curr_selected_obj.point0.array[1] == temp[1]);

                    var matchP1 = (curr_selected_obj.point1.array[0] == temp[0] &&
                        curr_selected_obj.point1.array[1] == temp[1]);

                    var matchP2 = (curr_selected_obj.point2.array[0] == temp[0] &&
                        curr_selected_obj.point2.array[1] == temp[1]);
                    
                    var matchP4 = (curr_selected_obj.point4.array[0] == temp[0] &&
                        curr_selected_obj.point4.array[1] == temp[1]);
                    if (matchP0 || matchP1 || matchP2 || matchP4) {
                        if (quads.length == 1)
                            quads = [];
                        else
                            quads.splice(i, 1);
                        i = -1;
                    }
                }
            }
            //reset reference to null once vertices are removed
            curr_selected_obj = null;
        } else {
            console.log("nothing selected to delete");
        }
        drawObjects(gl,a_Position, u_FragColor);
    });

    // set event handlers for color sliders
    document.getElementById("RedRange").addEventListener(
            "input",
            function () {
                //console.log("RedRange:" + document.getElementById("RedRange").value/100);
                rgba_arrays[index][0] = document.getElementById("RedRange").value/100;
                drawObjects(gl,a_Position, u_FragColor);
                //console.log(rgba_arrays);  
            });
    document.getElementById("GreenRange").addEventListener(
            "input",
            function () {
                //console.log("GreenRange:" + document.getElementById("GreenRange").value/100);
                rgba_arrays[index][1] = document.getElementById("GreenRange").value/100;
                drawObjects(gl,a_Position, u_FragColor);
                //console.log(rgba_arrays);  
            });
    document.getElementById("BlueRange").addEventListener(
            "input",
            function () {
                //console.log("BlueRange:" + document.getElementById("BlueRange").value/100);
                rgba_arrays[index][2] = document.getElementById("BlueRange").value/100;
                drawObjects(gl,a_Position, u_FragColor);
                //console.log(rgba_arrays);  
            });
                          
            
    // init sliders 
    document.getElementById("RedRange").value = rgba_arrays[index][0] * 100;
    document.getElementById("GreenRange").value = rgba_arrays[index][1] * 100;
    document.getElementById("BlueRange").value = rgba_arrays[index][2] * 100;
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
 * When an object is selected, setSliders() is called to set sliders to that object type's current color
 */
function setSliders() {
    document.getElementById("RedRange").value = rgba_arrays[index][0] * 100;
    document.getElementById("GreenRange").value = rgba_arrays[index][1] * 100;
    document.getElementById("BlueRange").value = rgba_arrays[index][2] * 100;
}

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
    // 1: LMB, 2: MMB, 3: RMB
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
                //draw triangles
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
                //draw quads
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
            //MMB is unused
            //console.log("pressed MMB");
            break;
        case 3:
            //RMB is used to select drawn objects
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
            var numTriangles = parseInt(tri_verts.length/3); //number of fully drawn triangles
            var numTriPoints = numTriangles * 3; //each triangle has 3 vertices

            //quads
            var quad_objects = [];
            var numQuads = parseInt(quads.length/6); //number of fully drawn quads
            var numQuadPoints = numQuads * 6; //each quad has 6 vertices (4 actual, 6 points required to draw 2 triangles)

            //Determine if a line is close to mouse click
            for (i = 0; i < numLinePoints; i+=2) {
                var p0 = new Vec2(line_verts[i]);
                var p1 = new Vec2(line_verts[i+1]);
                var distance = pointLineDist(p0, p1, p);
                //new object to hold a 'line' 
                var line = {
                    objType: "LINE",    //for discerning selection
                    point0: p0,         //Vec2 of line vertex
                    point1: p1,         //Vec2 of line vertex
                    d: distance         //distance of mouse click to line
                };
                lines.push(line);       //array that holds all 'line' objects
            }
            //sort lines by distance from mouse click point
            lines.sort(function(a,b){ return a.d - b.d; });
            //if line is sufficiently close to mouse click (0.025 felt right)
            //if (lines[0] != null && lines[0].d <= 0.025) {
                //clickedObjs.push(lines[0]);
            //}

            for (i = 0; i < lines.length; i++) {
                if (lines[i].d <= 0.025) {
                    clickedObjs.push(lines[i]);
                }
            }
            
            //if the clicked point is within a triangle
            for (i = 0; i < numTriPoints; i+=3) {
                var p0 = new Vec2(tri_verts[i]);
                var p1 = new Vec2(tri_verts[i+1]);
                var p2 = new Vec2(tri_verts[i+2]);
                var bary_coords = barycentric(p0,p1,p2,p);          //calculate barycentric coordinates of p given triangle vertices p0, p1, p2
                if (bary_coords[0] <= 1 && bary_coords[0] >= 0 &&   //if point p is within the triangle
                    bary_coords[1] <= 1 && bary_coords[1] >= 0 &&
                    bary_coords[2] <= 1 && bary_coords[2] >= 0) {
                    //new object to hold a 'triangle'
                    var triangle = {
                        objType: "TRIANGLE",
                        point0: p0,
                        point1: p1,
                        point2: p2,
                        barycentric_coord: bary_coords
                    };
                    //triangles.push(triangle);
                    clickedObjs.push(triangle); //if p is within 'triangle', triangle is selected
                }
            }
            
            //if the clicked point is withink a quadrilateral
            for (i = 0; i < numQuadPoints; i+=6) {
                //since quads are composed of 2 triangles, 6 vectors needed
                var p0 = new Vec2(quads[i]);
                var p1 = new Vec2(quads[i+1]);
                var p2 = new Vec2(quads[i+2]);
                var p3 = new Vec2(quads[i+3]);
                var p4 = new Vec2(quads[i+4]);
                var p5 = new Vec2(quads[i+5]);
                //calculated the barycentric coordinates of p in both triangles
                var bary_coords_1 = barycentric(p0, p1, p2, p);
                var bary_coords_2 = barycentric(p3, p4, p5, p);
                //if p is in 1st triangle
                var inTriangle_1 = (bary_coords_1[0] <= 1 && bary_coords_1[0] >= 0 &&
                                    bary_coords_1[1] <= 1 && bary_coords_1[1] >= 0 &&
                                    bary_coords_1[2] <= 1 && bary_coords_1[2] >= 0);
                //if p is in 2nd triangle       
                var inTriangle_2 = (bary_coords_2[0] <= 1 && bary_coords_2[0] >= 0 &&
                                    bary_coords_2[1] <= 1 && bary_coords_2[1] >= 0 &&
                                    bary_coords_2[2] <= 1 && bary_coords_2[2] >= 0);
                //if p is in either triangle, quad is selected
                if (inTriangle_1 || inTriangle_2) {
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

            /**
             * selectedObjs: 'objects' (lines, triangles, quads) that were identified as selected on LAST RMB click
             * clickedObjs: 'objects' (lines, triangles, quads) that were identified as selected on THIS RMB click
             * 
             * Determine if (clickedObjs == selectedObjs)
             * if (clickedObjs == selectedObjs) => curr_selected_obj = next_obj in selectedObjs
             */
            if (clickedObjs.length != 0) {
                if (clickedObjs.length == selectedObjs.objs.length) {
                    var different = false; //flag for noting change in selected objects
                    //if any element in the new array is different than old array
                    for(i = 0; i < clickedObjs.length; i++) {
                        if (clickedObjs[i].objType == selectedObjs.objs[i].objType){
                            if (clickedObjs[i].objType == "TRIANGLE" && selectedObjs.objs[i].objType == "TRIANGLE") {
                            //create 'triangle' objects to compare that don't include the barycentric coordinates of the RMB click point
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
                                    different = true;   //new selected object composition exists
                            }

                            if (clickedObjs[i].objType == "LINE" && selectedObjs.objs[i].objType == "LINE") {
                                //create 'line' objects to compare that don't include the point-line-distance of the RMB click point
                                var iLine = {
                                    p0: clickedObjs[i].point0,
                                    p1: clickedObjs[i].point1
                                };

                                var sLine = {
                                    p0: selectedObjs.objs[i].point0,
                                    p1: selectedObjs.objs[i].point1
                                };

                                if (JSON.stringify(iLine)!=JSON.stringify(sLine))
                                    different = true;   //new selected object composition exists
                            }

                            if(clickedObjs[i].objType == "QUAD" && selectedObjs.objs[i].objType == "QUAD") {
                                if (JSON.stringify(clickedObjs[i])!=JSON.stringify(selectedObjs.objs[i]))
                                    different = true;   //new selected object composition exists
                            }

                        } else {
                            //if (clickedObjs[i].objType != selectedObjs.objs[i].objType)
                            different = true;
                        }
                    }
                    if (different) { //new object arrangement selected with RMB click
                        selectedObjs.objs = [];
                        for(i = 0; i < clickedObjs.length; i++) {
                            selectedObjs.objs.push(clickedObjs[i]);
                        }
                        selectedObjs.index = 0;
                    } else { //clickedObjs == selectedObjs
                        //increment index of selected objects to iterate through selected objects
                        selectedObjs.index += 1;
                        if (selectedObjs.index > selectedObjs.objs.length - 1) {
                            selectedObjs.index = 0;
                        }
                    }
                } else { //if (clickedObjs.length != selectedObjs.length)
                    //new object arrangement selected with RMB click
                    selectedObjs.objs = [];
                    for(i = 0; i < clickedObjs.length; i++) {
                        selectedObjs.objs.push(clickedObjs[i]);
                    }
                    selectedObjs.index = 0;
                }
                //set the currently selected object to curr_selected_obj
                curr_selected_obj=selectedObjs.objs[selectedObjs.index];

                /**
                 * index: used in function setSliders() to access array associated with rgba values for selected object type.
                 *        the rgba values associated with the curr_selected_obj.objType are passed to the r g b sliders upon selection.
                 */
                if (curr_selected_obj.objType == "LINE") {
                    index = 0;
                }
                if (curr_selected_obj.objType == "TRIANGLE") {
                    index = 1;
                }
                if (curr_selected_obj.objType == "QUAD") {
                    index = 2;
                }
            } else {
                curr_selected_obj = null;
                //console.log("no objects selected");
            }
            
            //set the r g b sliders to the stored curr_selected_obj.objType color
            setSliders();
            break;
        default:
            break;
    }

    //drawObjects called to show indication vertices on selected object
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
        gl.uniform4f(u_FragColor, rgba_arrays[0][0], rgba_arrays[0][1], rgba_arrays[0][2], rgba_arrays[0][3]);
        // draw the lines
        gl.drawArrays(gl.LINES, 0, line_verts.length );
    }

    //Draw triangles
    if (tri_verts.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_tri);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(tri_verts), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, rgba_arrays[1][0], rgba_arrays[1][1], rgba_arrays[1][2], rgba_arrays[1][3]);
        gl.drawArrays(gl.TRIANGLES, 0, tri_verts.length);
    }

    //Draw Quads
    if (quads.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_quad);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(quads), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, rgba_arrays[2][0], rgba_arrays[2][1], rgba_arrays[2][2], rgba_arrays[2][3]);
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
