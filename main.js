import './style.css';
import {decodeJwt} from 'jose';
import {getDeviceCode, pollForTokens} from './authentication';
import {createQRCode} from './qr';

const startElement = document.querySelector('#start');
const loginButtonElement = document.querySelector('#login');

const codesElement = document.querySelector('#codes');
const canvasElement = document.querySelector('#qr-canvas');
const userCodeElement = document.querySelector('#user-code');

const userElement = document.querySelector('#user');
const userAvatarElement = document.querySelector('#user-avatar');
const userNameElement = document.querySelector('#user-name');
const userEmailElement = document.querySelector('#user-email');

const reloadElement = document.querySelector('#reload');

let codesResponse;
let tokensResponse;
let user;

async function handlePollForTokens() {
    const pollInterval = setInterval(async () => {
        const response = await pollForTokens(codesResponse['device_code']);
        if (response.responseStatus === 200) {
            tokensResponse = response;
            clearInterval(pollInterval);

            user = decodeJwt(tokensResponse['id_token']);
            userAvatarElement.src = user?.picture;
            userNameElement.innerHTML = `${user?.name} (${user?.nickname})`;
            userEmailElement.innerHTML = user?.email;
            codesElement.classList.toggle('hidden');
            userElement.classList.toggle('hidden');
	    reloadElement.classList.toggle('hidden');

	    console.log("Autentificación OK!");
	    try {
	     let response = await fetch("http://authbox.local:5000/open");
	     if (response.ok) {
		let json = await response.json();
		console.log(json);
	     }
	    } catch (error) {
		console.log(error);
	    }
        } 
    }, codesResponse.interval * 1000);
};

// URL-Safe Base64 Encoder
function encodeUrlSafeBase64(input) {
  // Convert the input string to a Base64 string
  const base64 = btoa(input);
  // Make the Base64 string URL-safe by replacing characters
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function handleRequestCodes() {
    try {
        codesResponse = await getDeviceCode();

	const verificationURI = codesResponse['verification_uri_complete'];
	const botURL = `https://lockbox-agent.auth0.works/?code=${encodeUrlSafeBase64(verificationURI)}`;
        await createQRCode(canvasElement, botURL);
        userCodeElement.innerHTML = codesResponse['user_code'];
        
        startElement.classList.toggle('hidden');
        codesElement.classList.toggle('hidden');

        handlePollForTokens();
    } catch (error) {
        console.error(error);
    }
};

loginButtonElement.addEventListener('click', handleRequestCodes);
