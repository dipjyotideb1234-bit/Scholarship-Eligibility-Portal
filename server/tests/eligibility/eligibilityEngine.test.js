import test from 'node:test'; import assert from 'node:assert/strict'; import {evaluateScholarship} from '../../src/services/eligibility/eligibilityEngine.js';
const rule=(field,operator,value,required=1)=>({id:1,field,operator,value:JSON.stringify(value),label:field,required});
test('all rules passing is eligible',()=>assert.equal(evaluateScholarship({family_income:200000,class_level:'12'},[rule('family_income','LESS_THAN_OR_EQUAL',300000),rule('class_level','IN',['11','12'])]).status,'ELIGIBLE'));
test('a failed rule is not eligible',()=>assert.equal(evaluateScholarship({family_income:400000},[rule('family_income','LESS_THAN_OR_EQUAL',300000)]).status,'NOT_ELIGIBLE'));
test('missing required data is possibly eligible',()=>assert.equal(evaluateScholarship({},[rule('family_income','LESS_THAN_OR_EQUAL',300000)]).status,'POSSIBLY_ELIGIBLE'));
test('between includes endpoints',()=>assert.equal(evaluateScholarship({annual_percentage:90},[rule('annual_percentage','BETWEEN',[90,100])]).status,'ELIGIBLE'));
test('not in evaluates correctly',()=>assert.equal(evaluateScholarship({state:'Delhi'},[rule('state','NOT_IN',['Maharashtra','Goa'])]).status,'ELIGIBLE'));
