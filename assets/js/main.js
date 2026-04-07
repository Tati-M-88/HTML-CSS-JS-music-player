import { data } from './data.js'
import { shuffle, toMinAndSecs } from './utils.js'

const AudioController = {
	state: {
		audios: [],
		current: {},
		playing: false,
		repeating: false,
		volume: 0.5
	},

	init() {
		this.initVariables()
		this.initEvents()
		this.renderAudios()
	},

	initVariables() {
		this.playButton = null
		this.audioList = document.querySelector('.items')
		this.currrentItem = document.querySelector('.current')
		this.repeatButton = document.querySelector('.handling-repeat')
		this.volumeButton = document.querySelector('.controls-volume')
		this.shuffleButton = document.querySelector('.handling-shuffle')
	},

	initEvents() {
		this.audioList.addEventListener('click', this.handleItem.bind(this))
		this.repeatButton.addEventListener('click', this.handleRepeat.bind(this))
		this.volumeButton.addEventListener('change', this.handleVolume.bind(this))
		this.shuffleButton.addEventListener('click', this.handleShuffle.bind(this))
	},

	/* Перемешивание песен в списке */
	handleShuffle() {
		const { children } = this.audioList
		const shuffled = shuffle([...children])
		
		this.audioList.innerHTML = ''
		shuffled.forEach((item) => this.audioList.appendChild(item))
	},

	/* Работа со звуком */
	handleVolume({ target: { value } }) {
		const { current } = this.state

		this.state.volume = value

		if (!current?.audio) return

		current.audio.volume = value
	},

	/* Повторение песни */
	handleRepeat({ currentTarget }) {
		const { repeating } = this.state

		currentTarget.classList.toggle('active', !repeating)
		this.state.repeating = !repeating
	},

	handleAudioPlay() {
		const { playing, current } = this.state
		const { audio } = current

		!playing ? audio.play() : audio.pause()

		this.state.playing = !playing

		this.playButton.classList.toggle('playing', !playing)
	},

	handleNext() {
		const { current } = this.state
		const currrentItem = document.querySelector(`[data-id="${current.id}"]`)
		const next = currrentItem.nextSibling?.dataset
		const first = this.audioList.firstChild?.dataset
		const itemId = next?.id || first?.id

		if (!itemId) return

		this.setCurrentItem(itemId)
	},

	handlePrev() {
		const { current } = this.state
		const currrentItem = document.querySelector(`[data-id="${current.id}"]`)
		const prev = currrentItem.previousSibling?.dataset
		const last = this.audioList.lastChild?.dataset
		const itemId = prev?.id || last?.id

		if (!itemId) return

		this.setCurrentItem(itemId)
	},

	handlePlayer() {
		const play = document.querySelector('.controls-play')
		const next = document.querySelector('.controls-next')
		const prev = document.querySelector('.controls-prev')

		this.playButton = play

		play.addEventListener('click', this.handleAudioPlay.bind(this))
		next.addEventListener('click', this.handleNext.bind(this))
		prev.addEventListener('click', this.handlePrev.bind(this))
	},

	audioUpdateHandler({ audio, duration }) {
		const progress = document.querySelector('.progress-current')
		const timeLine = document.querySelector('.timeline-start')

		audio.play()

		audio.addEventListener('timeupdate', ({ target }) => {
			const { currentTime } = target
			const width = currentTime * 100 / duration

			timeLine.innerHTML = toMinAndSecs(currentTime)
			progress.style.width = `${width}%`
		})

		audio.addEventListener('ended', ({ target }) => {
			target.currentTime = 0
			progress.style.width = `0%`
			this.state.repeating ? target.play() : this.handleNext()
		})
	},

	renderCurrentItem({ link, track, group, duration, year }) {
		const [image] = link.split('.')

		return `<div class="current-image" style="background-image: url(./assets/images/${image}.jpg)"></div>
				<div class="current-info">
					<div class="current-info__top">
						<div class="current-info__titles">
							<h2 class="current-info__group">${group}</h2>
							<h3 class="current-info__track">${track}</h3>
						</div>

						<div class="current-info__year">${year}</div>
					</div>
					<div class="controls">
						<div class="controls-buttons">
							<button class="controls-button controls-prev">
								<img class="icon-arrow" src="assets/images/prev.svg" alt="Previous">
							</button>
							<button class="controls-button controls-play">
								<img class="icon-pause" src="assets/images/pause.svg" alt="Pause">
								<img class="icon-play" src="assets/images/play.svg" alt="Play">
							</button>
							<button class="controls-button controls-next">
								<img class="icon-arrow" src="assets/images/prev.svg" alt="Next">
							</button>
						</div>
						<div class="controls-progress">
							<div class="progress">
								<div class="progress-current"></div>
							</div>
							<div class="timeline">
								<span class="timeline-start">00:00</span>
								<span class="timeline-end">${toMinAndSecs(duration)}</span>
							</div>
						</div>
					</div>
				</div>`
	},

	pauseCurrentAudio() {
		const { current: { audio } } = this.state

		if (!audio) return

		audio.pause()
		audio.currentTime = 0
	},

	togglePlaying() {
		const { playing, current } = this.state
		const { audio } = current

		playing ? audio.play() : audio.pause()

		this.playButton.classList.toggle('playing', playing)
	},

	setCurrentItem(itemId) {
		const current = this.state.audios.find(({ id }) => +id === +itemId)

		if (!current) return

		this.pauseCurrentAudio()

		this.state.current = current
		this.currrentItem.innerHTML = this.renderCurrentItem(current)

		current.audio.volume = this.state.volume

		this.handlePlayer()
		this.audioUpdateHandler(current)

		setTimeout(() => {
			this.togglePlaying()
		}, 10)
	},

	handleItem({ target }) {
		const { id } = target.dataset

		if (!id) return

		this.setCurrentItem(id)
	},

	/* Список песен */
	renderItem({ id, link, track, group, duration, genre }) {
		const [image] = link.split('.')

		return `<div class="item" data-id="${id}">
			<div class="item-image" style="background-image: url(./assets/images/${image}.jpg)"></div>
			<div class="item-titles">
				<h2 class="item-group">${group}</h2>
				<h3 class="item-track">${track}</h3>
			</div>
			<p class="item-duration">${toMinAndSecs(duration)}</p>
			<p class="item-genre">${genre}</p>
			<button class="item-play">
				<img class="icon-play" src="assets/images/play.svg" alt="Play">
			</button>
		</div>`
	},

	loadAudioData(audio) {
		this.audioList.innerHTML += this.renderItem(audio)
	},

	renderAudios() {
		data.forEach((item) => {
			const audio = new Audio(`./assets/audio/${item.link}`)

			audio.addEventListener('loadeddata', () => {
				const newItem = { ...item, duration: audio.duration, audio }

				//this.state.audios = [...this.state.audios, newItem]
				this.state.audios.push(newItem)
				this.loadAudioData(newItem)
			})
		})
	}
}

AudioController.init()