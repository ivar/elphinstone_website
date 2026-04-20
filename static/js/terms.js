(function () {
  function closeAll() {
    document.querySelectorAll('.term-def.is-open').forEach(function (def) {
      def.classList.remove('is-open');
      def.querySelector('.term-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.term-trigger');
    if (trigger) {
      e.stopPropagation();
      var def = trigger.closest('.term-def');
      var wasOpen = def.classList.contains('is-open');
      closeAll();
      if (!wasOpen) {
        def.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    } else {
      closeAll();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });
})();
