// Populates index.html from data/site-data.json.
// To add news later: open data/site-data.json and add an object to the
// "news" array, e.g.
//   { "date": "2026-09", "highlighted": false, "html": "Gave a talk at ..." }
// "date" can be "YYYY-MM" or "YYYY-MM-DD". Set "highlighted": true for
// items that should always float to the top (e.g. paper acceptances),
// regardless of how old they are. Highlighted items are sorted newest
// first among themselves; everything else is sorted newest first below them.
//
// For publications: add an "acceptanceRate" string field (e.g. "22%") to
// any entry in the "publications" array once the rate is known/public.
// It's optional — entries without it simply don't show a rate badge.

async function loadSiteData() {
	const res = await fetch('data/site-data.json');
	if (!res.ok) throw new Error('Failed to load site data: ' + res.status);
	return res.json();
}

function formatDate(dateStr) {
	const parts = dateStr.split('-').map(Number);
	const [year, month, day] = parts;
	const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
	const opts = day
		? { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
		: { year: 'numeric', month: 'long', timeZone: 'UTC' };
	return date.toLocaleDateString('en-US', opts);
}

function renderProfile(profile) {
	const photo = document.getElementById('profilePhoto');
	photo.src = profile.photo;
	photo.alt = profile.name;

	document.getElementById('profileTitle').textContent =
		`${profile.title} • ${profile.affiliation}`;
	document.getElementById('profileName').textContent = profile.name;
	document.getElementById('profileBio').textContent = profile.bio;

	const tagList = document.getElementById('profileTags');
	tagList.innerHTML = '';
	(profile.tags || []).forEach(tag => {
		const li = document.createElement('li');
		li.className = 'tag';
		li.textContent = tag;
		tagList.appendChild(li);
	});

	document.title = `${profile.name} – ${profile.title}`;
}

function renderNews(news) {
	const list = document.getElementById('newsList');
	list.innerHTML = '';

	const highlighted = news.filter(n => n.highlighted).sort((a, b) => b.date.localeCompare(a.date));
	const rest = news.filter(n => !n.highlighted).sort((a, b) => b.date.localeCompare(a.date));

	[...highlighted, ...rest].forEach(item => {
		const li = document.createElement('li');
		li.className = 'news-item' + (item.highlighted ? ' news-item--highlighted' : '');

		const meta = document.createElement('div');
		meta.className = 'news-meta';
		if (item.highlighted) {
			const badge = document.createElement('span');
			badge.className = 'news-badge';
			badge.textContent = 'Highlight';
			meta.appendChild(badge);
		}
		const date = document.createElement('time');
		date.textContent = formatDate(item.date);
		meta.appendChild(date);

		const text = document.createElement('p');
		text.innerHTML = item.html;

		li.appendChild(meta);
		li.appendChild(text);
		list.appendChild(li);
	});

	if (news.length === 0) {
		list.innerHTML = '<li class="news-empty">No news yet &ndash; check back soon.</li>';
	}
}

// Matches an author string against the site owner's name (from profile.name),
// independent of formatting, so bolding works automatically for any paper
// added to the JSON rather than being hardcoded per publication.
function isSelfAuthor(author, selfName) {
	return author.trim().toLowerCase() === selfName.trim().toLowerCase();
}

function renderPublications(publications, selfName) {
	const container = document.getElementById('publicationsList');
	container.innerHTML = '';

	publications.forEach(pub => {
		const card = document.createElement('article');
		card.className = 'pub-card';

		const title = document.createElement('h3');
		title.textContent = pub.title;
		card.appendChild(title);

		const authors = document.createElement('p');
		authors.className = 'pub-authors';
		authors.innerHTML = pub.authors
			.map(a => (isSelfAuthor(a, selfName) ? `<strong>${a}</strong>` : a))
			.join(', ');
		card.appendChild(authors);

		const venue = document.createElement('p');
		venue.className = 'pub-venue';
		venue.innerHTML = `<em>${pub.venue}</em>`;
		if (pub.status === 'accepted') {
			const badge = document.createElement('span');
			badge.className = 'status-badge';
			badge.textContent = 'Accepted';
			venue.appendChild(document.createTextNode(' '));
			venue.appendChild(badge);
		}
		if (pub.acceptanceRate) {
			const rate = document.createElement('span');
			rate.className = 'rate-badge';
			rate.textContent = `Acceptance rate: ${pub.acceptanceRate}`;
			venue.appendChild(document.createTextNode(' '));
			venue.appendChild(rate);
		}
		card.appendChild(venue);

		const links = document.createElement('p');
		links.className = 'pub-links';
		if (pub.links && pub.links.length) {
			pub.links.forEach(link => {
				const a = document.createElement('a');
				a.href = link.url;
				a.target = '_blank';
				a.rel = 'noopener';
				a.className = 'pub-link-btn';
				a.textContent = link.label;
				links.appendChild(a);
			});
		} else {
			const span = document.createElement('span');
			span.className = 'pub-pending';
			span.textContent = 'PDF coming soon';
			links.appendChild(span);
		}
		card.appendChild(links);

		container.appendChild(card);
	});
}

function renderExperience(experience) {
	const list = document.getElementById('experienceList');
	list.innerHTML = '';

	experience.forEach(item => {
		const li = document.createElement('li');
		li.className = 'timeline-item';

		const role = document.createElement('h3');
		role.textContent = item.role;

		const period = document.createElement('p');
		period.className = 'timeline-period';
		period.innerHTML = item.period;

		const desc = document.createElement('p');
		desc.className = 'timeline-desc';
		desc.innerHTML = item.html;

		li.appendChild(role);
		li.appendChild(period);
		li.appendChild(desc);
		list.appendChild(li);
	});
}

function renderBlogs(blogs) {
	document.getElementById('blogsText').innerHTML = blogs.html;
}

function initNavToggle() {
	const toggle = document.getElementById('navToggle');
	const nav = document.getElementById('primaryNav');
	toggle.addEventListener('click', () => {
		const isOpen = nav.classList.toggle('open');
		toggle.setAttribute('aria-expanded', String(isOpen));
	});
	nav.querySelectorAll('a').forEach(a => {
		a.addEventListener('click', () => {
			nav.classList.remove('open');
			toggle.setAttribute('aria-expanded', 'false');
		});
	});
}

async function init() {
	initNavToggle();
	document.getElementById('year').textContent = new Date().getFullYear();

	try {
		const data = await loadSiteData();
		renderProfile(data.profile);
		renderNews(data.news || []);
		renderPublications(data.publications || [], data.profile.name);
		renderExperience(data.experience || []);
		renderBlogs(data.blogs || { html: '' });
	} catch (err) {
		console.error(err);
		document.querySelector('main').insertAdjacentHTML(
			'afterbegin',
			'<p class="load-error">Could not load site content. If you\'re viewing this from a local file, run it through a local web server (e.g. <code>python3 -m http.server</code>) instead of opening the HTML file directly.</p>'
		);
	}
}

init();
