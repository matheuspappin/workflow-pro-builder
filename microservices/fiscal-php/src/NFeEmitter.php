<?php
declare(strict_types=1);

namespace FiscalWorker;

use NFePHP\NFe\Tools;
use NFePHP\Common\Certificate;

/**
 * Emissor de NF-e usando sped-nfe.
 * Recebe certificado em memória, monta XML, assina e transmite à SEFAZ.
 *
 * @see https://github.com/nfephp-org/sped-nfe
 */
class NFeEmitter
{
    public function emit(string $pfxContent, string $password, array $nfeData): array
    {
        $cert = Certificate::readPfx($pfxContent, $password);

        $config = [
            'tpAmb' => (int) ($nfeData['ambiente'] ?? 2),
            'razaosocial' => $nfeData['emitente']['razao_social'] ?? '',
            'cnpj' => preg_replace('/\D/', '', $nfeData['emitente']['cnpj'] ?? ''),
            'siglaUF' => $nfeData['emitente']['endereco']['uf'] ?? 'SP',
            'schemes' => 'PL_009_V4',
            'versao' => '4.00',
        ];

        $tools = new Tools(json_encode($config), $cert);
        $tools->model('55');

        $xml = $this->buildNFeXml($nfeData);
        $xmlAssinado = $tools->signNFe($xml);

        $idLote = str_pad((string) time(), 15, '0', STR_PAD_LEFT);
        $resp = $tools->sefazEnviaLote([$xmlAssinado], $idLote);

        if (!isset($resp['nRec'])) {
            return [
                'success' => false,
                'error' => $resp['xMotivo'] ?? $resp['cStat'] ?? 'Erro ao transmitir NF-e',
                'codigo_sefaz' => $resp['cStat'] ?? null,
            ];
        }

        $nRec = $resp['nRec'];
        sleep(2);
        $prot = $tools->sefazConsultaRecibo($nRec);

        if (!isset($prot['nfeProc'])) {
            return [
                'success' => false,
                'error' => $prot['xMotivo'] ?? $prot['cStat'] ?? 'NF-e não autorizada',
                'codigo_sefaz' => $prot['cStat'] ?? null,
            ];
        }

        $nfeProc = $prot['nfeProc'];
        $chave = $nfeProc['protNFe']['infProt']['chNFe'] ?? '';
        $numero = $nfeProc['protNFe']['infProt']['nProt'] ?? '';

        return [
            'success' => true,
            'chave' => $chave,
            'protocolo' => $numero,
            'numero' => substr($chave, 25, 9),
            'xml_autorizado' => $prot['nfeProc'] ?? null,
        ];
    }

    /**
     * Monta o XML da NFe usando a classe Make do sped-nfe.
     */
    private function buildNFeXml(array $nfe): string
    {
        $make = new \NFePHP\NFe\Make();

        $ide = $this->buildIde($nfe);
        $emit = $this->buildEmit($nfe);
        $dest = $this->buildDest($nfe);
        $det = $this->buildDet($nfe);
        $total = $this->buildTotal($nfe);

        $make->tagide($ide);
        $make->tagemit($emit);
        $make->tagdest($dest);
        foreach ($det as $d) {
            $make->tagdet($d);
        }
        $make->tagtotal($total);
        $make->taginfAdic($nfe['informacoes_adicionais'] ?? '');

        return $make->getXML();
    }

    private function buildIde(array $nfe): array
    {
        return [
            'cUF' => $this->getCUF($nfe['emitente']['endereco']['uf'] ?? 'SP'),
            'cNF' => $this->randomCNF(),
            'natOp' => $nfe['natureza_operacao'] ?? 'Prestação de Serviços',
            'mod' => '55',
            'serie' => '1',
            'nNF' => (string) random_int(1, 999999999),
            'dhEmi' => date('c'),
            'tpNF' => '1',
            'idDest' => '1',
            'cMunFG' => '3550308',
            'tpImp' => '1',
            'tpEmis' => '1',
            'cDV' => '0',
            'tpAmb' => (int) ($nfe['ambiente'] ?? 2),
            'finNFe' => $nfe['finalidade'] ?? '1',
            'indFinal' => '1',
            'indPres' => '1',
            'procEmi' => '0',
            'verProc' => '1.0.0',
        ];
    }

    private function buildEmit(array $nfe): array
    {
        $e = $nfe['emitente'];
        $end = $e['endereco'];
        return [
            'CNPJ' => preg_replace('/\D/', '', $e['cnpj']),
            'xNome' => $e['razao_social'],
            'xFant' => $e['nome_fantasia'] ?? $e['razao_social'],
            'enderEmit' => [
                'xLgr' => $end['logradouro'],
                'nro' => $end['numero'],
                'xBairro' => $end['bairro'] ?? 'Centro',
                'cMun' => '3550308',
                'xMun' => $end['municipio'],
                'UF' => $end['uf'],
                'CEP' => preg_replace('/\D/', '', $end['cep']),
                'cPais' => '1058',
                'xPais' => 'Brasil',
            ],
            'IE' => $e['ie'] ?? '',
            'CRT' => $e['crt'] ?? '1',
        ];
    }

    private function buildDest(array $nfe): array
    {
        $d = $nfe['destinatario'];
        $doc = preg_replace('/\D/', '', $d['cpf_cnpj']);
        $len = strlen($doc);
        $dest = [
            'CNPJ' => $len === 14 ? $doc : null,
            'CPF' => $len === 11 ? $doc : null,
            'xNome' => $d['nome'],
            'enderDest' => [
                'xLgr' => $d['endereco']['logradouro'] ?? 'Não informado',
                'nro' => $d['endereco']['numero'] ?? 'S/N',
                'xBairro' => $d['endereco']['bairro'] ?? 'Centro',
                'cMun' => '3550308',
                'xMun' => $d['endereco']['municipio'] ?? 'São Paulo',
                'UF' => $d['endereco']['uf'] ?? 'SP',
                'CEP' => preg_replace('/\D/', '', $d['endereco']['cep'] ?? '01001000'),
                'cPais' => '1058',
                'xPais' => 'Brasil',
            ],
        ];
        if (!empty($d['email'])) {
            $dest['email'] = $d['email'];
        }
        return $dest;
    }

    private function buildDet(array $nfe): array
    {
        $itens = [];
        foreach ($nfe['itens'] as $item) {
            $itens[] = [
                'nItem' => $item['numero'],
                'prod' => [
                    'cProd' => $item['codigo'],
                    'cEAN' => 'SEM GTIN',
                    'xProd' => $item['descricao'],
                    'NCM' => $item['ncm'],
                    'CFOP' => $item['cfop'],
                    'uCom' => $item['unidade'],
                    'qCom' => (float) $item['quantidade'],
                    'vUnCom' => (float) $item['valor_unitario'],
                    'vProd' => (float) $item['valor_total'],
                    'cEANTrib' => 'SEM GTIN',
                    'uTrib' => $item['unidade'],
                    'qTrib' => (float) $item['quantidade'],
                    'vUnTrib' => (float) $item['valor_unitario'],
                    'indTot' => '1',
                    'vTotTrib' => 0,
                ],
                'imposto' => [
                    'vTotTrib' => 0,
                    'ICMS' => [
                        'ICMSSN102' => [
                            'orig' => '0',
                            'CSOSN' => '102',
                        ],
                    ],
                    'PIS' => [
                        'PISOutr' => [
                            'CST' => '49',
                            'vBC' => 0,
                            'pPIS' => 0,
                            'vPIS' => 0,
                        ],
                    ],
                    'COFINS' => [
                        'COFINSOutr' => [
                            'CST' => '49',
                            'vBC' => 0,
                            'pCOFINS' => 0,
                            'vCOFINS' => 0,
                        ],
                    ],
                ],
            ];
        }
        return $itens;
    }

    private function buildTotal(array $nfe): array
    {
        $tot = $nfe['total'];
        return [
            'ICMSTot' => [
                'vBC' => 0,
                'vICMS' => 0,
                'vICMSDeson' => 0,
                'vFCP' => 0,
                'vBCST' => 0,
                'vST' => 0,
                'vFCPST' => 0,
                'vFCPSTRet' => 0,
                'vProd' => (float) ($tot['valor_produtos'] ?? $tot['valor_total']),
                'vFrete' => 0,
                'vSeg' => 0,
                'vDesc' => (float) ($tot['valor_desconto'] ?? 0),
                'vII' => 0,
                'vIPI' => 0,
                'vIPIDevol' => 0,
                'vPIS' => 0,
                'vCOFINS' => 0,
                'vOutro' => 0,
                'vNF' => (float) $tot['valor_total'],
                'vTotTrib' => 0,
            ],
        ];
    }

    private function getCUF(string $uf): int
    {
        $map = ['AC'=>1,'AL'=>2,'AP'=>3,'AM'=>4,'BA'=>5,'CE'=>6,'DF'=>7,'ES'=>8,'GO'=>9,'MA'=>10,'MT'=>11,'MS'=>12,'MG'=>13,'PA'=>14,'PB'=>15,'PR'=>16,'PE'=>17,'PI'=>18,'RJ'=>19,'RN'=>20,'RS'=>21,'RO'=>22,'RR'=>23,'SC'=>24,'SP'=>25,'SE'=>26,'TO'=>27];
        return $map[strtoupper($uf)] ?? 25;
    }

    private function randomCNF(): string
    {
        return str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
    }
}
