# Wetter-App

In dieser Aufgabe sollte eine kleine Web-App erstellt werden, die aktuelle Wetterdaten für eine eingegebene Stadt oder Postleitzahl anzeigt. Die App sendet zuerst eine Anfrage an die Nominatim-Geocoding-API, um Breiten- und Längengrad zu erhalten. Mit diesen Koordinaten wird anschließend eine zweite Anfrage an die Open-Meteo-Wetter-API geschickt, um Temperatur, Wettercode und weitere Daten abzurufen. Die Ergebnisse werden dann auf der Webseite dargestellt – inklusive Ortsname, Icon, Temperatur und Wetterbeschreibung.
Dazu solltest du Klassen für Orts- und Wetterdaten verwenden, Fehler (z. B. ungültige Eingabe oder keine Treffer) sichtbar anzeigen und die Webseite mit HTML/CSS gestalten. Abschließend muss die App über DOM-Manipulation alle Informationen dynamisch anzeigen.
