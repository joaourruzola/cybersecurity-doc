const sideMenuItems = document.querySelectorAll("#topic-id");

try {
	fetch("topics.json")
		.then((response) => response.json())
		.then((data) => {
			sideMenuItems.forEach((topic) => {
				topic.addEventListener("click", (event, index) => {
					const clickedItem = event.target;

					const previouslyClickedItem =
						document.querySelector(".selected");
					if (previouslyClickedItem) {
						previouslyClickedItem.classList.remove("selected");
					}

					clickedItem.classList.add("selected");

					const matchedTopic = data.topics.find(
						(topic) => topic.topic_name === clickedItem.innerText
					);

					if (matchedTopic) {
						const currentIndex = data.topics.indexOf(matchedTopic);

						const topicElement =
							document.getElementById("topic-text");
						const topicTitle =
							document.getElementById("topic-title");

						topicTitle.textContent = matchedTopic.topic_name;
						topicElement.innerHTML = matchedTopic.text;

						if (currentIndex > 0) {
							renderPreviousContent(
								data.topics[currentIndex - 1]
							);
							showBackCard();
						} else {
							hideBackCard();
						}

						if (currentIndex < data.topics.length - 1) {
							renderNextContent(data.topics[currentIndex + 1]);
							showNextCard();
						} else {
							hideNextCard();
						}
					} else {
						console.log("Error, topic not found!");
					}
				});
			});

			const back = document.getElementById("backCard");
			const next = document.getElementById("nextCard");

			back.addEventListener("click", handleClick);
			next.addEventListener("click", handleClick);
		})
		.catch((error) => console.error("Error fetching JSON:", error));
} catch (err) {
	console.error(err);
}

//CARD RENDERING
function renderPreviousContent(previousTopic) {
	const previousContent = document.getElementById("backCard");
	previousContent.innerHTML = `
    <div class="backCard">
        <span style="vertical-align: middle">
            <ion-icon style="vertical-align: middle" name="arrow-back-outline"></ion-icon>
            Voltar
        </span>
        <h4>${previousTopic.topic_name}</h4>
        <p><i>${truncateText(previousTopic.text)}</i></p>
    </div>
    `;
}

function renderNextContent(nextTopic) {
	const nextContent = document.getElementById("nextCard");
	nextContent.innerHTML = `
    <div class="nextCard">
        <span style="vertical-align: middle">
            Próximo
            <ion-icon style="vertical-align: middle" name="arrow-forward-outline"></ion-icon>
        </span>
        <h4>${nextTopic.topic_name}</h4>
        <p><i>${truncateText(nextTopic.text)}</i></p>
    </div>
    `;
}

// CSS CHANGES
function hideBackCard() {
	const backCard = document.getElementById("backCard");
	backCard.style.display = "none";
}

function hideNextCard() {
	const nextCard = document.getElementById("nextCard");
	nextCard.style.display = "none";
}

function showNextCard() {
	const nextCard = document.getElementById("nextCard");
	nextCard.style.display = "flex";
}
function showBackCard() {
	const nextCard = document.getElementById("backCard");
	nextCard.style.display = "flex";
}

//CARD LAYOUT
function truncateText(text) {
	const words = text.split(" ");
	if (words.length > 5) {
		return words.slice(0, 6).join(" ") + " ...";
	} else {
		return text;
	}
}

//CARD CLICK HANDLING
async function handleClick() {
	const response = await fetch("topics.json");
	const data = await response.json();

	const h4Element = this.querySelector("h4").textContent;

	const matchedTopic = data.topics.find(
		(topic) => topic.topic_name === h4Element
	);

	if (matchedTopic) {
		const topicElement = document.getElementById("topic-text");
		const topicTitle = document.getElementById("topic-title");
		const currentIndex = data.topics.indexOf(matchedTopic);

		topicTitle.textContent = matchedTopic.topic_name;
		topicElement.innerHTML = matchedTopic.text;

		if (currentIndex > 0) {
			renderPreviousContent(data.topics[currentIndex - 1]);
			showBackCard();
		} else {
			hideBackCard();
		}

		if (currentIndex < data.topics.length - 1) {
			renderNextContent(data.topics[currentIndex + 1]);
			showNextCard();
		} else {
			hideNextCard();
		}
	}
}
