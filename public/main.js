const form = document.getElementById("vote-form");
var event;

form.addEventListener("submit", e => {
  const choice = document.querySelector("input[name=language]:checked").value;
  const data = { language: choice };

  fetch("http://localhost:3000/poll", {
    method: "post",
    body: JSON.stringify(data),
    headers: new Headers({
      "Content-Type": "application/json"
    })
  })
    .then(res => res.json())
    .catch(err => console.log(err));

  e.preventDefault();
});

fetch("http://localhost:3000/poll")
  .then(res => res.json())
  .then(data => {
    let votes = data.votes;
    let totalVotes = votes.length;
    document.querySelector(
      "#chartTitle"
    ).textContent = `Total Votes: ${totalVotes}`;

    let voteCounts = {
      Go: 0,
      Javascript: 0,
      Dart: 0,
      Python: 0,
      Java: 0,
      Others: 0
    };

    voteCounts = votes.reduce(
      (acc, vote) => (
        (acc[vote.language] =
          (acc[vote.language] || 0) + parseInt(vote.points)),
        acc
      ),
      {}
    );

    let dataPoints = [
      { y: voteCounts.Go, label: "Go" },
      { y: voteCounts.Java, label: "Java" },
      { y: voteCounts.Javascript, label: "Javascript" },
      { y: voteCounts.Dart, label: "Dart" },
      { y: voteCounts.Python, label: "Python" },
      { y: voteCounts.Others, label: "Others" }
    ];

    const chartContainer = document.querySelector("#chartContainer");

    if (chartContainer) {
      const chart = new CanvasJS.Chart("chartContainer", {
        theme: "light2",
        animationEnabled: true,
        title: {
          text: "Top Most Language In The World By 2022"
        },
        data: [
          {
            type: "pie",
            startAngle: 25,
            toolTipContent: "<b>{label}</b>: {y}%",
            showInLegend: "true",
            legendText: "{label}",
            indexLabelFontSize: 16,
            indexLabel: "{label} - {y}%",
            dataPoints: dataPoints
          }
        ]
      });
      chart.render();

      const pusher = new Pusher("3b1e2a0db53e1ceaff37", {
        cluster: "ap2",
        forceTLS: true
      });
      var channel = pusher.subscribe("language-poll");

      channel.bind("language-vote", function(data) {
        dataPoints.forEach(point => {
          if (point.label == data.language) {
            point.y += data.points;
            totalVotes += data.points;
            event = new CustomEvent("votesAdded", {
              detail: { totalVotes: totalVotes }
            });
            document.dispatchEvent(event);
          }
        });
        chart.render();
      });
    }
  });
