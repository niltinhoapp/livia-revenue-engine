import test from 'node:test';
import assert from 'node:assert/strict';
import { assessIntent } from './intent-radar.js';
const url='https://example.org/post/123';
test('dono procurando atendimento é alta prioridade',()=> {
 const result=assessIntent({sourceUrl:url,text:'Tenho um salão de beleza e preciso automatizar o atendimento no WhatsApp. Alguém indica sistema?'});
 assert.equal(result.level,'HIGH'); assert.equal(result.decision,'REVIEW');
});
test('empresa sem intenção não vira oportunidade',()=> {
 const result=assessIntent({sourceUrl:url,text:'Tenho uma barbearia no centro. Venham conhecer nosso trabalho.'});
 assert.notEqual(result.level,'HIGH');
});
test('fornecedor não passa como comprador',()=> {
 const result=assessIntent({sourceUrl:url,text:'Vendo robôs de atendimento pelo WhatsApp. Quem precisa contratar um sistema?'});
 assert.equal(result.level,'NONE');
});
test('fonte ausente bloqueia alta intenção',()=> {
 const result=assessIntent({sourceUrl:'',text:'Tenho um salão e preciso automatizar atendimento no WhatsApp. Alguém indica?'});
 assert.equal(result.level,'NONE');
});
