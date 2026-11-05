import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:45000,workers:1,use:{baseURL:'http://localhost:3000',browserName:'chromium',channel:'msedge',headless:true,viewport:{width:1500,height:1000}},reporter:'list'});
