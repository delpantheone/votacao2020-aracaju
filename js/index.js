const ctxZone = document.getElementById("votesByZone");
const candidates = document.getElementById("candidates");
const schools = document.querySelector(".table");

let chartZones;
let jsonData;
let setZones;
let setCandidates;
let setTurns;
let setSchools;
let zoneFilter = [];

fetch("src/data.json")
  .then((response) => {
    if (response.ok === true) {
      return response.json();
    }
  })
  .then((data) => {
    jsonData = data;
    setZones = new Set(jsonData.map((row) => row.NR_ZONA));
    setCandidates = new Set(jsonData.map((row) => row.NM_VOTAVEL));
    setTurns = new Set(jsonData.map((row) => row.NR_TURNO));
    setSchools = new Set(jsonData.map((row) => row.NM_LOCAL_VOTACAO));
    for (const candidate of setCandidates.values()) {
      const option = document.createElement("option");
      option.value = candidate;
      option.innerText = candidate;
      candidates.append(option);
    }
    createChart(data, "polarArea");
    createSchoolsList(data);
  });

function createSchoolsList(data) {
  schools.innerHTML =
    "<div class='table-header'><div>Local de votação</div><div>Zona</div><div>Votos</div></div>";
  const list = [];
  for (const school of setSchools) {
    const votes = data
      .filter(
        (row) =>
          row.NM_VOTAVEL === candidates.value &&
          row.NM_LOCAL_VOTACAO === school,
      )
      .map((row) => Number(row.QT_VOTOS))
      .reduce((acc, cv) => acc + cv, 0);
    const zone = data
      .filter(
        (row) =>
          row.NM_VOTAVEL === candidates.value &&
          row.NM_LOCAL_VOTACAO === school &&
          zoneFilter.indexOf(row.NR_ZONA) > -1,
      )
      .map((row) => row.NR_ZONA)
      .pop();
    const renamedSchool = school
      .split(",")
      .reverse()
      .join()
      .replaceAll(",", " ")
      .replaceAll(/(.*(?=\())(\(.*\))(.*)/g, "$1$3 - $2")
      .trim();
    list.push({ renamedSchool, votes, zone });
  }
  const filteredList = list
    .filter((item) => item.votes !== 0 && item.zone)
    .sort((a, b) => b.votes - a.votes);
  for (const item of filteredList) {
    const schoolItem = document.createElement("div");
    const schoolName = document.createElement("div");
    const schoolZone = document.createElement("div");
    const schoolVotes = document.createElement("div");
    schoolItem.classList.add("table-item");
    schoolName.classList.add("table-item-name");
    schoolZone.classList.add("table-item-zone");
    schoolVotes.classList.add("table-item-votes");
    schoolItem.append(schoolName);
    schoolItem.append(schoolZone);
    schoolItem.append(schoolVotes);
    schoolName.innerText = item.renamedSchool;
    schoolZone.innerText = item.zone;
    schoolVotes.innerText = item.votes.toString();
    schools.append(schoolItem);
  }

  const tableRows = document.querySelectorAll(".table > div");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("show", entry.isIntersecting);
        if (entry.isIntersecting) observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0,
    },
  );
  tableRows.forEach((row) => {
    observer.observe(row);
  });
}

candidates.addEventListener("change", (ev) => {
  setChartType(ctxZone.getAttribute("type"));
});

function setChartType(chartType) {
  chartZones.destroy();
  zoneFilter.splice(0, zoneFilter.length);
  createChart(jsonData, chartType);
  createSchoolsList(jsonData);
}

function createChart(data, type) {
  ctxZone.setAttribute("type", type);
  const zones = [...setZones];
  const zonesLabels = [];
  const arrVotesByNameAndZone = [];
  for (const item of zones) {
    zonesLabels.push(`Zona ${item}`);
    arrVotesByNameAndZone.push(votesByNameAndZone(candidates.value, item));
    zoneFilter.push(`${item}`);
  }
  function votesByNameAndZone(name, zone) {
    return data
      .filter((row) => row.NM_VOTAVEL === name && row.NR_ZONA === zone)
      .map((row) => Number(row.QT_VOTOS))
      .reduce((acc, cv) => acc + cv, 0)
      .toString();
  }
  function votesByName(name) {
    return (
      data
        .filter((row) => row.NM_VOTAVEL === name)
        .map((row) => Number(row.QT_VOTOS))
        .reduce((acc, cv) => acc + cv, 0)
        .toString() || 0
    );
  }
  chartZones = new Chart(ctxZone, {
    type: type,
    data: {
      labels: zonesLabels,
      datasets: [
        {
          label: "Votos",
          data: arrVotesByNameAndZone,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        title: {
          display: true,
          text: `Total de votos: ${votesByName(candidates.value)}`,
        },
        legend: {
          display: true,
          onClick: handleClick,
        },
      },
    },
  });
  function handleClick(ev, legendItem, legend) {
    const searchItem = legendItem.text.match(/\d+/g).pop();
    if (zoneFilter.indexOf(searchItem) > -1) {
      zoneFilter.splice(zoneFilter.indexOf(searchItem), 1);
    } else {
      zoneFilter.push(searchItem);
    }
    createSchoolsList(jsonData);
    legend.chart.toggleDataVisibility(legendItem.index);
    legend.chart.update();
  }
}
