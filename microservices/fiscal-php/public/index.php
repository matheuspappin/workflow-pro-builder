<?php
declare(strict_types=1);

use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addErrorMiddleware(true, true, true);

// Health check
$app->get('/health', function (Request $req, Response $res) {
    $res->getBody()->write(json_encode(['status' => 'ok', 'service' => 'fiscal-worker']));
    return $res->withHeader('Content-Type', 'application/json');
});

// POST /emitir - Recebe dados da nota + certificado base64, assina e envia à SEFAZ
$app->post('/emitir', function (Request $req, Response $res) {
    $body = $req->getParsedBody();
    if (!$body || !isset($body['certificate_base64']) || !isset($body['nfe'])) {
        $res->getBody()->write(json_encode([
            'success' => false,
            'error' => 'Payload inválido: certificate_base64 e nfe são obrigatórios'
        ]));
        return $res->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    $certBase64 = $body['certificate_base64'];
    $certPassword = $body['certificate_password'] ?? '';
    $nfeData = $body['nfe'];

    $certBinary = base64_decode($certBase64, true);
    if ($certBinary === false) {
        $res->getBody()->write(json_encode(['success' => false, 'error' => 'Certificado base64 inválido']));
        return $res->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    try {
        $emitter = new \FiscalWorker\NFeEmitter();
        $result = $emitter->emit($certBinary, $certPassword, $nfeData);
        $res->getBody()->write(json_encode($result));
        return $res->withHeader('Content-Type', 'application/json');
    } catch (\Throwable $e) {
        $res->getBody()->write(json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'codigo_sefaz' => $e->getCode() ? (string) $e->getCode() : null
        ]));
        return $res->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
});

$app->run();
