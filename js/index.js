const ctxZone = document.getElementById("votesByZone");
const candidates = document.getElementById("candidates");
const schools = document.querySelector(".schools");

let chartZones;
let jsonData;
let setZones;
let setCandidates;
let setTurns;
let setSchools;

fetch("/src/data.json")
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
    "<tr><th>Local Votação</th><th>Zona</th><th>Votos</th></tr>";
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
          row.NM_LOCAL_VOTACAO === school,
      )
      .map((row) => row.NR_ZONA)
      .pop();
    const renamedSchool = school
      .split(",")
      .reverse()
      .join()
      .replace(",", " ")
      .trim();
    list.push({ renamedSchool, votes, zone });
  }
  const filteredList = list
    .filter((item) => item.votes !== 0)
    .sort((a, b) => b.votes - a.votes);
  for (const item of filteredList) {
    const schoolItem = document.createElement("tr");
    const schoolName = document.createElement("td");
    const schoolZone = document.createElement("td");
    const schoolVotes = document.createElement("td");
    schoolItem.classList.add("school");
    schoolName.classList.add("school-name");
    schoolZone.classList.add("school-zone");
    schoolVotes.classList.add("school-votes");
    schoolItem.append(schoolName);
    schoolItem.append(schoolZone);
    schoolItem.append(schoolVotes);
    schoolName.innerText = item.renamedSchool;
    schoolZone.innerText = item.zone;
    schoolVotes.innerText = item.votes.toString();
    schools.firstChild.append(schoolItem);
  }
}

candidates.addEventListener("change", (ev) => {
  setChartType(ctxZone.getAttribute("type"));
  createSchoolsList(jsonData);
});

function setChartType(chartType) {
  chartZones.destroy();
  createChart(jsonData, chartType);
}

function createChart(data, type) {
  ctxZone.setAttribute("type", type);
  const zones = [...setZones];
  const zonesLabels = [];
  const arrVotesByNameAndZone = [];
  for (const item of zones) {
    zonesLabels.push(`Zona ${item}`);
    arrVotesByNameAndZone.push(votesByNameAndZone(candidates.value, item));
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
          // onclick: handleClick,
        },
      },
    },
  });
  function handleClick(ev, item, legend) {
    // not Working
    console.log(ev, item);
    legend.chart.update();
  }
}
