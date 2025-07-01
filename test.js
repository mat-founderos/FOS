"use strict";
(function () {
  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {

    function getNextOccurrence(dayOfWeek, hour, minute) {
      const now = new Date();
      const result = new Date(now);

      result.setUTCDate(now.getUTCDate() + ((7 + dayOfWeek - now.getUTCDay()) % 7));
      result.setUTCHours(hour, minute, 0, 0);

      if (result <= now) {
        result.setUTCDate(result.getUTCDate() + 7);
      }

      return result;
    }

    function getNextDeadline() {
      const now = new Date();

      const wednesday0630 = getNextOccurrence(3, 10, 30); // 6:30 a.m. ET = 10:30 UTC
      const friday1100 = getNextOccurrence(5, 15, 0);     // 11:00 a.m. ET = 15:00 UTC

      if (now < wednesday0630) {
        return { time: wednesday0630, type: "wednesday" };
      } else if (now < friday1100) {
        return { time: friday1100, type: "friday" };
      } else {
        // Next week's Wednesday
        const nextWednesday = getNextOccurrence(3, 10, 30);
        return { time: nextWednesday, type: "wednesday" };
      }
    }

    function updateCountdown() {
      let deadlineObj = getNextDeadline();
      let deadline = deadlineObj.time;
      let type = deadlineObj.type;

      const x = setInterval(function () {
        const now = new Date().getTime();
        const distance = deadline.getTime() - now;

        if (distance < 0) {
          clearInterval(x);
          // Restart timer for the next event
          updateCountdown();
          return;
        }

        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        days = days < 10 ? '0' + days : days;
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        const daysElements = document.querySelectorAll("[app-el='js-clock-days']");
        const hoursElements = document.querySelectorAll("[app-el='js-clock-hours']");
        const minutesElements = document.querySelectorAll("[app-el='js-clock-minutes']");
        const secondsElements = document.querySelectorAll("[app-el='js-clock-seconds']");

        daysElements.forEach((_, i) => {
          daysElements[i].textContent = days;
          hoursElements[i].textContent = hours;
          minutesElements[i].textContent = minutes;
          secondsElements[i].textContent = seconds;
        });
      }, 1000);
    }

    updateCountdown();
  });
})();
