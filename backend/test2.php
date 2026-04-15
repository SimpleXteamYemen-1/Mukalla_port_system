<?php
$parser = new \Smalot\PdfParser\Parser();
$pdf = $parser->parseFile(storage_path('app/public/manifests/wfK9fiwrCKGEQ3Em839vI8JpkItsZYJGbB4F0Qa4.pdf'));
echo substr($pdf->getText(), 0, 1000);
