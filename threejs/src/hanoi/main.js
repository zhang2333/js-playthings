;(function () {
    if (!Detector.webgl) Detector.addGetWebGLMessage()

    const MODEL_PATH = '../../model/hanoi-scene.json'
    const Config = {
        auto: true,
        velocity: 10,
        velocityMin: 1,
        velocityMax: 500,
        platesNum: 5,
        platesNumMin: 1,
        platesNumMax: 100,
        cameraRotation: .01 / 180 * Math.PI,
        cameraRotateSpeed: 0,
        hoverHighlightColor: 0x555555,
        selectedHighlightColor: 0xff5555,
    }

    class GUIControls {
        constructor(v, resetCamera, restart) {
            this.auto = Config.auto
            this.plates = Config.platesNum
            this.rotateSpeed = Config.cameraRotateSpeed

            this.velocity = v
            this.restart = restart
            this.resetCamera = resetCamera
        }
    }

    class Hanoi {
        constructor(containerId, modelPath) {
            this.containerId = containerId

            this.v = Config.velocity
            this.manualMove = {}
            this.plates = []

            this._initPromise = new Promise((res) => {
                this._initPromiseRes = res
            })

            // load the scene
            const loader = new THREE.ObjectLoader()
            loader.load(modelPath, (result) => {
                this._loadModel(result)
                this._init()
            })
        }

        _loadModel(model) {
            this.scene = model

            const plane = model.children[0]
            const poleBlack = model.children[1]
            const poleGray = model.children[2]
            const poleWihte = model.children[3]

            const planeDefScale = {}
            planeDefScale.x = plane.scale.x
            planeDefScale.y = plane.scale.y
            planeDefScale.z = plane.scale.z
            this.poleDefScaleY = poleWihte.scale.y

            const plate = model.children[4]
            plate.weight = 1
            this.plate = plate

            const poles = []
            poles.push(poleBlack)
            poles.push(poleGray)
            poles.push(poleWihte)
            this.poles = poles

            this.light = model.children[5]
            this.scene.remove(plate)

            this.plane = plane
            this.planeDefScale = planeDefScale
            this.poleBlack = poleBlack
            this.poleGray = poleGray
            this.poleWihte = poleWihte

            console.log('loaded model')
        }

        _init() {
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000)
            camera.position.set(350, 363, 350)
            this.camera = camera

            // renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true })
            renderer.setClearColor(0xffffff)
            renderer.setSize(window.innerWidth, window.innerHeight)
            renderer.shadowMap.enabled = true
            renderer.shadowMapSoft = true
            this.renderer = renderer

            const container = document.getElementById(this.containerId)
            container.appendChild(renderer.domElement)

            // AmbientLight
            this.scene.add(new THREE.AmbientLight(0x909090))

            // gui controls
            const guiControls = new GUIControls(this.v, this._resetCamera.bind(this), this._restart.bind(this))
            this.guiControls = guiControls

            const datGUI = new dat.GUI()
            datGUI.add(guiControls, 'auto')
            datGUI.add(guiControls, 'plates', Config.platesNumMin, Config.platesNumMax).step(1)
            datGUI.add(guiControls, 'velocity', Config.velocityMin, Config.velocityMax)
            datGUI.add(guiControls, 'rotateSpeed', 0, 100)
            datGUI.add(guiControls, 'resetCamera')
            datGUI.add(guiControls, 'restart')

            // plate interaction
            this.raycaster = new THREE.Raycaster()
            this.mouse = new THREE.Vector2()

            // controls
            const controls = new THREE.OrbitControls(camera, renderer.domElement)
            controls.enableDamping = true
            controls.dampingFactor = 0.25
            controls.enableZoom = true
            this.controls = controls

            // stats
            const stats = new Stats()
            stats.domElement.style.position = 'absolute'
            stats.domElement.style.top = '0px'
            stats.domElement.style.zIndex = 100
            container.appendChild(stats.domElement)
            this.stats = stats

            document.addEventListener('mousemove', this._onMouseMove.bind(this), false)
            document.addEventListener('click', this._onClick.bind(this), false)
            window.addEventListener('resize', this._onWindowResize.bind(this), false)

            this._initPromiseRes()

            console.log('inited scene')
        }

        start() {
            this._initPromise.then(() => {
                this._restart()
                this._animate()
            })
        }

        _restart() {
            this.selected = null
            this.intersected = null
            this.manualMove = {}
            this.camera.position.set(350, 363, 350)

            const { plate, scene, plane, planeDefScale, poles, guiControls, poleDefScaleY, poleBlack } = this

            // clear plates
            for (let i in this.plates) {
                scene.remove(this.plates[i])
            }

            // add plates
            const plates = []
            for (let i = 0; i <= guiControls.plates - 1; i++) {
                const p = new THREE.Mesh(plate.geometry.clone(), plate.material.clone())
                p.scale.set(plate.scale.x * (1 + (.2 * i)), plate.scale.y, plate.scale.z * (1 + (.2 * i)))
                p.material.color = new THREE.Color(randomColorHex())
                p.weight = i + 1
                plates.push(p)
                scene.add(p)
            }
            this.plates = plates

            // init plane
            plane.scale.x = planeDefScale.x
            plane.scale.z = planeDefScale.z
    
            // init poles
            for (let i in poles) {
                poles[i].scale.y = poleDefScaleY
            }

            // expand plane, poles
            const box = new THREE.Box3().setFromObject(plane)
            if (guiControls.plates > 4) {
                // expand plane
                const plateWidth = new THREE.Box3().setFromObject(plates[plates.length - 1]).size().x
                let scale = .1
                while (box.size().z < 3 * plateWidth) {
                    plane.scale.x = planeDefScale.x * (scale + 1)
                    plane.scale.z = planeDefScale.z * (scale + 1)
                    scale += .1
                    box.setFromObject(plane)
                }
    
                // expand poles
                if (guiControls.plates > 10) {
                    for (let i in poles) {
                        poles[i].scale.y = poleDefScaleY * ((guiControls.plates - 10) * .1 + 1)
                    }
                }
            }

            // reset poles
            box.setFromObject(plane)
            const x = plane.position.x
            const y = plane.position.y
            const z = plane.position.z
            const yl = box.size().y
            const zl = box.size().z

            box.setFromObject(poleBlack)
            const poleHeight = box.size().y
            this.poleHeight = poleHeight

            // set poles' position
            poleBlack.position.set(x, y + yl / 2 + poleHeight / 2, z + zl / 3)
            this.poleGray.position.set(x, y + yl / 2 + poleHeight / 2, z)
            this.poleWihte.position.set(x, y + yl / 2 + poleHeight / 2, z - zl / 3)
            this.poleTop = poleBlack.position.y + poleHeight / 2
            this.poleBottom = poleBlack.position.y - poleHeight / 2

            box.setFromObject(plate)
            this.plateHeight = box.size().y
    
            this.guiControls.resetCamera()

            this._reAutoRun()
        }

        _movePlate(plateId, poleId) {
            const { manualMove, guiControls, poleBottom, plateHeight, poleTop } = this
            const plate = typeof(plateId) == 'object' ? plateId : this.plates[plateId]
            const pole = typeof(poleId) == 'object' ? poleId : this.poles[poleId]
            // big one can't place over the smaller one
            const f1 = pole.arr.length > 0 && pole.arr[pole.arr.length - 1].weight < plate.weight
            // invalid operation
            const f2 = pole.arr.indexOf(plate) != -1 && !plate.stat
            if (f1 || f2) {
                if (manualMove.which) {
                    delete manualMove.which
                    delete manualMove.to
                }
                return
            }
            // rise or trans or fall
            if (plate.stat == 'trans') {
                plate.position.z += pole.position.z > plate.position.z ? guiControls.velocity : -guiControls.velocity
                if (Math.abs(plate.position.z - pole.position.z) <= guiControls.velocity) {
                    plate.position.z = pole.position.z
                    plate.stat = 'fall'
                    pole.arr.push(plate)
                }
            } else if (plate.stat == 'fall') {
                plate.position.y -= guiControls.velocity
                if (plate.position.y <= poleBottom + plateHeight * (pole.arr.length - .5)) {
                    plate.position.y = poleBottom + plateHeight * (pole.arr.length - .5)
                    delete plate.stat
                    if (manualMove.which) {
                        delete manualMove.which
                        delete manualMove.to
                    } else {
                        this.currentStep = null
                    }
                }
            } else {
                plate.position.y += guiControls.velocity
                if (plate.position.y >= poleTop + plateHeight / 2) {
                    plate.position.y = poleTop + plateHeight / 2
                    plate.stat = 'trans'
                    this._operatePlateFromPole(plate, true)
                }
            }
        }

        // compute steps and set into stepCache
        _computeSteps() {
            const plateArr = this.poleBlack.arr.concat([]).reverse()
            const froms = []
            for (let p in plateArr) {
                plateArr[p] = this.plates.indexOf(plateArr[p])
                froms[p] = 0
            }
            this._getNextStep = move(plateArr, 2, froms)
        }

        // reset position of plates
        _resetPlates() {
            for (let i in this.poles) {
                this.poles[i].arr = []
            }
            for (let ii = this.plates.length - 1; ii >= 0; ii--) {
                this._placePlate(ii, 0)
            }
        }

        _placePlate(plateId, poleId) {
            const plate = this.plates[plateId]
            const pole = this.poles[poleId]
            if (plate.stat) {
                delete plate.stat
            }
            plate.position.z = pole.position.z
            pole.arr.push(plate)
            plate.position.y = this.poleBottom + this.plateHeight * (pole.arr.length - .5)
        }

        _resetCamera() {
            this.camera.position.set(this.poleHeight * 4 + 50, this.poleHeight * 4 + 50, 50)
        }

        _operatePlateFromPole(plate, remove) {
            const poles = this.poles
            for (let i in poles) {
                if (poles[i].arr.indexOf(plate) != -1) {
                    if (remove == true) {
                        poles[i].arr.splice(poles[i].arr.indexOf(plate), 1)
                    }
                    return parseInt(i)
                }
            }
            return -1
        }

        _reAutoRun() {
            this.currentStep = null
            this._getNextStep = null
            this._resetPlates()
            this._computeSteps()
        }

        _animate() {
            window.requestAnimationFrame(this._animate.bind(this))

            const { guiControls, mouse, camera, raycaster, poles, plates, intersected, selected, manualMove } = this

            if (guiControls.auto) {
                if (!this.currentStep) {
                    this.currentStep = this._getNextStep ? this._getNextStep() : null
                }

                const step = this.currentStep
                if (step !== null) {
                    this._movePlate(step.which, step.to)
                } else if (this._getNextStep) {
                    this._reAutoRun()
                }
            } else {
                if (manualMove.which) {
                    this._movePlate(manualMove.which, manualMove.to)
                }
            }

            // move over plates
            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(selected ? poles : plates)
            if (intersects.length > 0) {
                if (intersected != intersects[0].object) {
                    this.intersected = intersects[0].object
                    // only the topest plate can be selected
                    if (!selected) {
                        const poleId = this._operatePlateFromPole(intersects[0].object, false)
                        if (poleId != -1) {
                            this.intersected = poles[poleId].arr[poles[poleId].arr.length - 1]
                        }
                    }
                    this.intersected.material.emissive.setHex(Config.hoverHighlightColor)
                }
            } else {
                if (intersected) {
                    intersected.material.emissive.setHex(0x000)
                    this.intersected = null
                }
            }

            // rotate camera
            const radius = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z)
            if (guiControls.rotateSpeed != 0) {
                const z = camera.position.z
                camera.position.z = camera.position.z * Math.cos(guiControls.rotateSpeed * Config.cameraRotation) +
                    camera.position.x * Math.sin(guiControls.rotateSpeed * Config.cameraRotation)
                const x = Math.sqrt(radius * radius - camera.position.z * camera.position.z)
                camera.position.x = camera.position.z - z >= 0 ? x : -x
            }
    
            this.controls.update()
            this.stats.update()

            this.renderer.render(this.scene, camera)
        }

        _onMouseMove(event) {
            event.preventDefault()
            this.mouse.x = (event.offsetX / window.innerWidth) * 2 - 1
            this.mouse.y = -(event.offsetY / window.innerHeight) * 2 + 1
        }

        _onClick(event) {
            event.preventDefault()

            if (this.guiControls.auto) return

            const { selected, intersected, manualMove } = this
            const targets = selected ? this.poles : this.plates
            const intersects = this.raycaster.intersectObjects(targets)
            if (intersects.length > 0 && !manualMove.to) {
                const newId = this._operatePlateFromPole(intersects[0].object, false)
                const intersectedId = this._operatePlateFromPole(intersected, false)
                if (newId == intersectedId) {
                    if (selected) {
                        manualMove.which = selected
                        manualMove.to = intersected
                        selected.material.emissive.setHex(0x000)
                        intersected.material.emissive.setHex(0x000)
                        this.selected = this.intersected = null
                    } else {
                        this.selected = intersected
                        this.selected.material.emissive.setHex(Config.selectedHighlightColor)
                        this.intersected = null
                    }
                }
            } else {
                if (selected) {
                    selected.material.emissive.setHex(0x000)
                }
                this.selected = null
            }
        }

        _onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(window.innerWidth, window.innerHeight)
        }
    }

    new Hanoi('main', MODEL_PATH).start()

    function move(whichIds, to, froms) {
        const cache = {}

        const calcCacheKey = (ids, to) => `${ids.join('_')}-${to}`

        function _move(whichIds, to) {
            if (!whichIds || !whichIds.length) return []
    
            const key = calcCacheKey(whichIds, to)
            if (cache[key]) return [key]
    
            let arr = []

            // simplest move if it's true
            if (whichIds.length == 1) {
                froms[whichIds[0]] = to
                arr.push({ which: whichIds[0], to })
            } else {
                const last = whichIds[whichIds.length - 1]
                // get idle pole
                const a = [0, 1, 2]
                a.splice(a.indexOf(to), 1)
                a.splice(a.indexOf(froms[last]), 1)
                const idlePole = a[0]
    
                // 1. move upper plates
                const arr1 = _move(whichIds.slice(0, whichIds.length - 1), idlePole)
    
                // 2. move the last plate to target
                const arr2 = _move([last], to)
    
                // 3. return upper plates
                const arr3 = _move(whichIds.slice(0, whichIds.length - 1), to)
    
                arr = arr.concat(arr1, arr2, arr3)
            }
    
            cache[key] = arr
    
            return arr
        }

        let steps = _move(whichIds, to, froms)

        return function next() {
            if (steps.length < 1) return null
    
            while(typeof(steps[0]) === 'string') {
                const k = steps.splice(0, 1)[0]
                steps = cache[k].concat(steps)
            }

            return steps.splice(0, 1)[0]
        }
    }

    function randomColorHex() {
        return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6)
    }
})()
