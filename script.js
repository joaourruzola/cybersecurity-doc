const sideMenuItems = document.querySelectorAll("#topic-id");
const hamburger = document.querySelector(".hambuger-menu");
const mobileMenu = document.querySelector(".mobileMenu");
const referenceHTML = document.querySelector(".references");
const logoLink = document.querySelector(".logo");
const darkTheme = document.querySelector(".dark-mode");
const citationLinks = document.querySelector(".citation-links");

try {
	fetch("./model/topics.json")
		.then((response) => response.json())
		.then((data) => {
			referenceHTML.addEventListener("click", handleReferenceClick);

			sideMenuItems.forEach((topic) => {
				topic.addEventListener("click", handleTopicMenuClick);
			});

			//CARD RENDER
			const back = document.getElementById("backCard");
			const next = document.getElementById("nextCard");

			back.addEventListener("click", handleClick);
			next.addEventListener("click", handleClick);

			//LOCAL STORAGE
			lsHandler(data);
			themeHandler();
		})
		.catch((error) => console.error("Error fetching JSON:", error));
} catch (err) {
	console.error(err);
}

logoLink.addEventListener("click", handleLogoClick);

function handleLogoClick(event) {
	localStorage.clear("clicked_item");
	event.preventDefault();
	window.location.reload();
}

async function handleReferenceClick(event) {
	const topicElement = document.getElementById("topic-text");
	const topicTitle = document.getElementById("topic-title");

	topicTitle.innerHTML = "Referências";
	topicElement.innerHTML = `
    IMC GRUPO. COVID-19 News: FBI Reports 300% Increase in Reported Cybercrimes. Disponível em: <a href='https://www.imcgrupo.com/covid-19-news-fbi-reports-300-increase-in-reported-cybercrimes/'>https://www.imcgrupo.com/covid-19-news-fbi-reports-300-increase-in-reported-cybercrimes/</a>.<br><br>

    BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Disponível em: <a href='https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm'>https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm</a>.<br><br>

    BOSCH. Cyber Security. Disponível em: <a href='https://www.bosch.com.br/noticias-e-historias/aiot/cyber-security/'>https://www.bosch.com.br/noticias-e-historias/aiot/cyber-security/</a>.<br><br>

    CSO. Top Cybersecurity Statistics, Trends, and Facts. Disponível em: <a href='https://www.csoonline.com/article/571367/top-cybersecurity-statistics-trends-and-facts.html'>https://www.csoonline.com/article/571367/top-cybersecurity-statistics-trends-and-facts.html</a>.<br><br>

    WIKIPÉDIA. Cavalo de Troia (computação). Disponível em: <a href='https://pt.wikipedia.org/wiki/Cavalo_de_troia_(computa%C3%A7%C3%A3o)'>https://pt.wikipedia.org/wiki/Cavalo_de_troia_(computa%C3%A7%C3%A3o)</a>.<br><br>

    WIKIPÉDIA. Spyware. Disponível em: <a href='https://pt.wikipedia.org/wiki/Spyware'>https://pt.wikipedia.org/wiki/Spyware</a>.<br><br>

    IT SECURITY WIRE. DDoS Attacks Rise Almost 5 Million in the First Half of 2020. Disponível em: <a href='https://itsecuritywire.com/featured/ddos-attacks-rise-almost-5-million-in-the-first-half-of-2020/'>https://itsecuritywire.com/featured/ddos-attacks-rise-almost-5-million-in-the-first-half-of-2020/</a>.<br><br>

    SAP BRASIL. What is Cybersecurity? Disponível em: <a href='https://www.sap.com/brazil/products/financial-management/what-is-cybersecurity.html'>https://www.sap.com/brazil/products/financial-management/what-is-cybersecurity.html</a>.<br><br>`;

	hideBackCard();
	hideNextCard();
}

//LOCAL STORAGE HANDLER
async function lsHandler(data) {
	const selectedTopic = localStorage.getItem("clicked_item");

	if (selectedTopic) {
		renderTopic(selectedTopic, data);
	}
}

function themeHandler() {
	darkTheme.addEventListener("click", function () {
		const toggleTheme = document.body.classList.toggle("dark-theme");
		localStorage.setItem("dark_theme", toggleTheme);
	});

	const isDarkTheme = JSON.parse(localStorage.getItem("dark_theme"));

	if (isDarkTheme) {
		document.body.classList.add("dark-theme");
	} else {
		document.body.classList.remove("dark-theme");
	}
}

//TOPIC CLICK HANDLER
async function handleTopicMenuClick(event) {
	const response = await fetch("./model/topics.json");
	const data = await response.json();

	const clickedItem = event.target;
	const clickedLink = clickedItem.closest("a");

	if (clickedLink) {
		localStorage.setItem("clicked_item", clickedLink.textContent);
		const previouslyClickedItem = document.querySelector(".selected");

		if (previouslyClickedItem) {
			previouslyClickedItem.classList.remove("selected");
		}

		clickedItem.classList.add("selected");

		renderTopic(clickedLink.textContent, data);
	}
}

function highlightTopicMenu(clickedItemText) {
	const sidebarItems = document.querySelectorAll(".sideBar-item a");

	sidebarItems.forEach((sidebarItem) => {
		if (sidebarItem.classList.contains("selected")) {
			sidebarItem.classList.remove("selected");
		}
		if (sidebarItem.textContent.trim() === clickedItemText) {
			sidebarItem.classList.add("selected");
		}
	});
}

//RENDER HTML FROM JSON
function renderTopic(clickedItemText, data) {
	const matchedTopic = data.topics.find(
		(topic) => topic.topic_name === clickedItemText
	);

	highlightTopicMenu(clickedItemText);

	if (matchedTopic) {
		const currentIndex = data.topics.indexOf(matchedTopic);

		const topicElement = document.getElementById("topic-text");
		const topicTitle = document.getElementById("topic-title");

		topicTitle.textContent = matchedTopic.topic_name;
		topicElement.innerHTML = matchedTopic.text;

		mobileMenu.classList.add("hidden");
		// if (screen.width < 780 && clickedItemText) {
		// 	mobileMenu.classList.toggle("hidden");
		// }

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
	} else {
		console.log("Error, topic not found!");
	}
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

//CARD CSS TOGGLE
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
	if (screen.width < 780) {
		return words.slice(0, 1).join(" ") + " ...";
	}
	if (words.length > 5) {
		return words.slice(0, 6).join(" ") + " ...";
	} else {
		return text;
	}
}

//CARD CLICK HANDLING
async function handleClick(event) {
	const response = await fetch("./model/topics.json");
	const data = await response.json();

	const clickedItem = event.target;
	const cardDiv = clickedItem.closest(".nextCard, .backCard");

	if (cardDiv) {
		const h4Element = cardDiv.querySelector("h4");
		if (h4Element) {
			highlightTopicMenu(h4Element.textContent);
		}
	}

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

//MOBILE MENU TOGGLE
hamburger.addEventListener("click", function () {
	mobileMenu.classList.toggle("hidden");
});
