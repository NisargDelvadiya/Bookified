'use client';

import React, { useEffect, useCallback } from 'react';
import { MessageSquarePlus } from 'lucide-react';

const FORM_PERMA_URL = 'https://forms.zohopublic.in/delvadiyagroupstechzoho1/form/FeedbackForm/formperma/yLVmZL149fgY4EtC4BAa6IHe_euBvrsR4M8iYSlce30?zf_rszfm=1';

export default function ZohoFeedbackModal({ buttonOnly = false }) {
    const deleteZForm = useCallback(() => {
        const divCont = document.getElementById('formsLightBox_248523');
        if (divCont) {
            divCont.style.display = 'none';
        }
        document.body.style.overflow = '';

        const iframeContainer = document.getElementById('yLVmZL149fgY4EtC4BAa6IHe_euBvrsR4M8iYSlce30_248523');
        if (iframeContainer) {
            const iframe = iframeContainer.getElementsByTagName('iframe')[0];
            if (iframe) {
                iframe.remove();
            }
        }
    }, []);

    const getsrcurlZForm = useCallback((zf_src) => {
        try {
            if (typeof window !== 'undefined') {
                const w = window;
                if (typeof w.ZFAdvLead !== 'undefined' && typeof w.zfutm_zfAdvLead !== 'undefined') {
                    for (let prmIdx = 0; prmIdx < w.ZFAdvLead.utmPNameArr.length; prmIdx++) {
                        const utmPm = w.ZFAdvLead.utmPNameArr[prmIdx];
                        const utmVal = w.zfutm_zfAdvLead.zfautm_gC_enc(utmPm);
                        if (typeof utmVal !== 'undefined' && utmVal !== '') {
                            zf_src += (zf_src.indexOf('?') > 0 ? '&' : '?') + utmPm + '=' + utmVal;
                        }
                    }
                }

                if (typeof w.ZFLead !== 'undefined' && typeof w.zfutm_zfLead !== 'undefined') {
                    for (let prmIdx = 0; prmIdx < w.ZFLead.utmPNameArr.length; prmIdx++) {
                        const utmPm = w.ZFLead.utmPNameArr[prmIdx];
                        const utmVal = w.zfutm_zfLead.zfutm_gC_enc(utmPm);
                        if (typeof utmVal !== 'undefined' && utmVal !== '') {
                            zf_src += (zf_src.indexOf('?') > 0 ? '&' : '?') + utmPm + '=' + utmVal;
                        }
                    }
                }

                if (!new RegExp('[?&]referrername=').test(zf_src)) {
                    let rfr = window.location.href;
                    try {
                        rfr =
                            window.self !== window.top
                                ? window.top.location.href
                                : /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}/i.test(rfr)
                                ? rfr
                                : '';
                    } catch {
                        // ignore cross-origin error
                    }

                    if (rfr && rfr !== '') {
                        const queryIndex = rfr.indexOf('?');
                        if (queryIndex > -1) {
                            rfr = rfr.substring(0, queryIndex);
                        }
                        if (rfr.length > 1800) {
                            rfr = rfr.substring(0, 1800);
                        }
                        zf_src += (zf_src.indexOf('?') > 0 ? '&' : '?') + 'referrername=' + encodeURIComponent(rfr);
                    }
                }
            }
        } catch {
            // fallback gracefully
        }
        return zf_src;
    }, []);

    const loadZForm = useCallback(() => {
        const iframeContainer = document.getElementById('yLVmZL149fgY4EtC4BAa6IHe_euBvrsR4M8iYSlce30_248523');
        if (!iframeContainer) return;

        let iframe = iframeContainer.getElementsByTagName('iframe')[0];
        if (!iframe) {
            const f = document.createElement('iframe');
            f.src = getsrcurlZForm(FORM_PERMA_URL);
            f.style.border = 'none';
            f.style.minWidth = '100%';
            f.style.overflow = 'hidden';
            iframeContainer.appendChild(f);

            const deleteForm = document.getElementById('deleteform_248523');
            if (deleteForm) {
                deleteForm.onclick = deleteZForm;
                deleteForm.onkeydown = (event) => {
                    if (event.key === 'Enter' || event.keyCode === 13 || event.key === ' ' || event.keyCode === 32) {
                        event.preventDefault();
                        deleteZForm();
                    }
                };
            }
        }
    }, [deleteZForm, getsrcurlZForm]);

    const constructDiv = useCallback(() => {
        if (document.getElementById('formsLightBox_248523')) return;

        const iframeDiv = document.createElement('div');
        iframeDiv.setAttribute('id', 'yLVmZL149fgY4EtC4BAa6IHe_euBvrsR4M8iYSlce30_248523');
        iframeDiv.setAttribute('class', 'zf_main_id_248523');

        const closeFormDiv = document.createElement('div');
        closeFormDiv.setAttribute('id', 'deleteform_248523');
        closeFormDiv.setAttribute('class', 'zf_lb_closeform_248523');
        closeFormDiv.setAttribute('tabindex', '0');
        closeFormDiv.setAttribute('role', 'button');
        closeFormDiv.setAttribute('aria-label', 'Close Feedback Form');

        const containerDiv = document.createElement('div');
        containerDiv.setAttribute('id', 'containerDiv_248523');
        containerDiv.setAttribute('class', 'zf_lB_Container_248523 fadeIn');
        containerDiv.appendChild(iframeDiv);
        containerDiv.appendChild(closeFormDiv);

        const wrapperDiv = document.createElement('div');
        wrapperDiv.setAttribute('class', 'zf_lB_Wrapper_248523');
        wrapperDiv.appendChild(containerDiv);

        const dimmerDiv = document.createElement('div');
        dimmerDiv.setAttribute('class', 'zf_lB_Dimmer_248523');
        dimmerDiv.setAttribute('elname', 'popup_box');
        dimmerDiv.onclick = deleteZForm;

        const mainDiv = document.createElement('div');
        mainDiv.setAttribute('id', 'formsLightBox_248523');
        mainDiv.style.display = 'none';
        mainDiv.appendChild(wrapperDiv);
        mainDiv.appendChild(dimmerDiv);

        document.body.appendChild(mainDiv);
    }, [deleteZForm]);

    const showZForm = useCallback(() => {
        constructDiv();
        loadZForm();

        const lightbox = document.getElementById('formsLightBox_248523');
        if (lightbox) {
            lightbox.style.display = 'block';
        }
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const containerDiv = document.getElementById('containerDiv_248523');
            if (containerDiv) {
                containerDiv.setAttribute('tabindex', '-1');
                containerDiv.focus();
            }
        }, 100);
    }, [constructDiv, loadZForm]);

    useEffect(() => {
        // Handle postMessage resize from Zoho Forms iframe
        const handleMessage = (event) => {
            const evntData = event.data;
            if (evntData && evntData.constructor === String) {
                const zf_ifrm_data = evntData.split('|');
                if (zf_ifrm_data.length === 2 || zf_ifrm_data.length === 3) {
                    const zf_perma = zf_ifrm_data[0];
                    const zf_ifrm_ht_nw = parseInt(zf_ifrm_data[1], 10) + 15 + 'px';
                    const iframeContainer = document.getElementById('yLVmZL149fgY4EtC4BAa6IHe_euBvrsR4M8iYSlce30_248523');
                    if (iframeContainer) {
                        const iframe = iframeContainer.getElementsByTagName('iframe')[0];
                        if (iframe && iframe.src.indexOf('formperma') > 0 && iframe.src.indexOf(zf_perma) > 0) {
                            const prevIframeHeight = iframe.style.height;
                            let zf_tout = false;
                            if (zf_ifrm_data.length === 3) {
                                iframe.scrollIntoView();
                                zf_tout = true;
                            }

                            if (prevIframeHeight !== zf_ifrm_ht_nw) {
                                if (zf_tout) {
                                    setTimeout(() => {
                                        iframe.style.minHeight = zf_ifrm_ht_nw;
                                        const containerDiv = document.getElementById('containerDiv_248523');
                                        if (containerDiv) containerDiv.style.height = zf_ifrm_ht_nw;
                                    }, 500);
                                } else {
                                    iframe.style.minHeight = zf_ifrm_ht_nw;
                                    const containerDiv = document.getElementById('containerDiv_248523');
                                    if (containerDiv) containerDiv.style.height = zf_ifrm_ht_nw;
                                }
                            }
                        }
                    }
                }
            }
        };

        // Handle Escape key to close form
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                const lightbox = document.getElementById('formsLightBox_248523');
                if (lightbox && lightbox.style.display !== 'none') {
                    deleteZForm();
                }
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('keydown', handleKeyDown);
            const mainDiv = document.getElementById('formsLightBox_248523');
            if (mainDiv) {
                mainDiv.remove();
            }
            document.body.style.overflow = '';
        };
    }, [deleteZForm]);

    return (
        <div className={buttonOnly ? "inline-flex" : "space-y-3"}>
            {/* Scoped CSS for Zoho Lightbox */}
            <style jsx global>{`
                .zf_lB_Dimmer_248523 {
                    position: fixed;
                    top: 0px;
                    left: 0px;
                    right: 0px;
                    bottom: 0px;
                    background: rgb(0, 0, 0);
                    opacity: 0.8;
                    z-index: 10000000;
                    backdrop-filter: blur(2px);
                }

                .zf_lB_Container_248523 {
                    position: fixed;
                    background-color: #ffffff;
                    margin: 0;
                    margin-right: 0px;
                    padding: 0;
                    height: 1019px;
                    width: 70%;
                    top: 50%;
                    left: 50%;
                    margin-right: -50%;
                    transform: translate(-50%, -50%);
                    border: 7px solid #f6d5ab;
                    border-radius: 12px;
                    max-height: calc(100% - 60px);
                    z-index: 10000001;
                    transition: height 0.5s ease;
                    outline: none;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
                }

                .zf_lB_Container_248523 p {
                    margin-bottom: 10px;
                }

                .zf_lB_Wrapper_248523 {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    margin-left: 0;
                    margin-top: -180px;
                    z-index: 10000001;
                }

                .zf_main_id_248523 {
                    height: calc(100% - 0px);
                    display: flex;
                    overflow-y: auto;
                    overflow-x: hidden;
                    border-radius: 6px;
                }

                .zf_lb_closeform_248523 {
                    position: absolute;
                    right: -20px;
                    background: #2f2e2e;
                    padding: 0;
                    border-radius: 50%;
                    width: 34px;
                    height: 34px;
                    top: -15px;
                    cursor: pointer;
                    border: 2px solid #d9d9d9;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
                    z-index: 10000002;
                    transition: transform 0.2s ease, background-color 0.2s ease;
                }
                .zf_lb_closeform_248523:hover {
                    transform: scale(1.1);
                    background: #111111;
                }
                .zf_lb_closeform_248523:before,
                .zf_lb_closeform_248523:after {
                    position: absolute;
                    left: 14px;
                    content: ' ';
                    height: 18px;
                    width: 2px;
                    top: 6px;
                    background-color: #f7f7f7;
                }

                .zf_lb_closeform_248523:before {
                    transform: rotate(45deg);
                }
                .zf_lb_closeform_248523:after {
                    transform: rotate(-45deg);
                }

                .fadeIn {
                    -webkit-animation-name: zf_fadeIn;
                    animation-name: zf_fadeIn;
                    -webkit-animation-duration: 0.3s;
                    animation-duration: 0.3s;
                    -webkit-animation-fill-mode: both;
                    animation-fill-mode: both;
                    display: block !important;
                }
                @-webkit-keyframes zf_fadeIn {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                @keyframes zf_fadeIn {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                @media screen and (min-device-width: 10px) and (max-device-width: 380px) {
                    .zf_lB_Container_248523 {
                        width: 290px !important;
                    }
                }

                @media screen and (min-device-width: 360px) and (max-device-width: 480px) {
                    .zf_lB_Container_248523 {
                        width: 350px !important;
                    }
                }

                @media screen and (min-device-width: 440px) and (max-device-width: 500px) {
                    .zf_lB_Container_248523 {
                        width: 380px !important;
                    }
                }

                @media only screen and (min-width: 500px) and (max-width: 600px) {
                    .zf_lB_Container_248523 {
                        width: 450px;
                    }
                }

                @media only screen and (min-width: 601px) and (max-width: 700px) {
                        width: 95% !important;
                        height: 90% !important;
                    }
                    .zf_lb_closeform_248523 {
                        right: 8px;
                        top: 8px;
                    }
                }

                @media screen and (min-device-width: 381px) and (max-device-width: 800px) {
                    .zf_lB_Container_248523 {
                        width: 90% !important;
                        height: 90% !important;
                    }
                    .zf_lb_closeform_248523 {
                        right: 8px;
                        top: 8px;
                    }
                }

                @media screen and (min-device-width: 801px) and (max-device-width: 1268px) {
                    .zf_lB_Container_248523 {
                        width: 750px !important;
                    }
                }
            `}</style>

            {/* Description & Action Button */}
            {!buttonOnly && (
                <p className="text-sm text-gray-300/90 leading-relaxed">
                    Have ideas, suggestions, or found an issue? We’d love to hear your thoughts.
                </p>
            )}

            <button
                id="zf_button_248523"
                type="button"
                onClick={showZForm}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-[#1a2332] hover:bg-white dark:hover:bg-[#222e42] text-[#212a3b] dark:text-gray-200 hover:text-black dark:hover:text-white text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-[#212a3b] focus-visible:outline-none active:scale-[0.98]"
                aria-haspopup="dialog"
                aria-label="Open Feedback Form"
            >
                <MessageSquarePlus className="w-4 h-4 text-black dark:text-gray-300 group-hover:scale-110 transition-transform duration-200" />
                <span>Share Feedback</span>
            </button>
        </div>
    );
}
