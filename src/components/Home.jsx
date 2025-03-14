import React, { useState } from 'react';
import mammoth from 'mammoth';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowUp, faFileImport, faCopy, faCircleNotch } from '@fortawesome/free-solid-svg-icons';


function Home() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleFileChange = (event) => {
    const fileTarget = event.target.files[0];
    const fileLabel = document.querySelector('.upload-file-label');
    if (fileTarget) {
      setFile(fileTarget);
      fileLabel.innerHTML = `${fileTarget.name}`;
    } else {
      setFile(null);
      fileLabel.innerHTML = `<strong>Click to upload</strong> or drag and drop<br />DOCX are Allowed.`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    });
  };

  const handleConvert = async () => {
    setIsLoading(true);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        let htmlString = result.value;

        // Parse the HTML string to a DOM object
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // console.log(doc);

        // Remove all content before the <h1></h1> tag
        let articleStart = null;
        let articleStartImg = null;
        [...doc.querySelectorAll('h1')].some(h1 => {
          const headImg = h1.querySelectorAll('img');
          articleStart = h1;
          articleStartImg = headImg;
          return true;
        });

        if (articleStart) {
          let previousSibling = articleStart.previousSibling;
          while (previousSibling) {
            const temp = previousSibling.previousSibling;
            previousSibling.remove();
            previousSibling = temp;
          }
          if (articleStartImg.length > 0) {
            if (articleStartImg.length > 1) {
              const headImgItems = Array.from(articleStartImg).map(img => {
                return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"","kbVersion":2} --><div class="wp-block-kadence-column"><div class="kt-inside-inner-col"><!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image --></div></div><!-- /wp:kadence/column -->`;
              }).join('');
              articleStart.outerHTML = `<!-- wp:kadence/rowlayout {"uniqueID":"","colLayout":"equal","firstColumnWidth":0,"secondColumnWidth":0,"thirdColumnWidth":0,"fourthColumnWidth":0,"fifthColumnWidth":0,"sixthColumnWidth":0,"kbVersion":2} -->${headImgItems}<!-- /wp:kadence/rowlayout -->`;
            } else {
              articleStart.outerHTML = `<!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
            }
          } else {
            articleStart.remove(); // Remove the <h1></h1> itself
          }
        }

        // Remove all content after the <p><strong>NOTE SEO Writer</strong></p> tag
        let noteSEOStart = null;
        doc.querySelectorAll('p').forEach(p => {
          const text = p.textContent.toLowerCase().trim();
          if (text === 'note seo writer') {
            noteSEOStart = p;
          }
        });

        if (noteSEOStart) {
          let nextSibling = noteSEOStart.nextSibling;
          while (nextSibling) {
            const temp = nextSibling.nextSibling;
            nextSibling.remove();
            nextSibling = temp;
          }
          noteSEOStart.remove(); // Remove the <p><strong>NOTE SEO Writer</strong></p> itself
        }

        // Find all <p> tags and modify them based on their content and child elements
        let checkReferences = false;
        doc.querySelectorAll('p').forEach((p) => {
          const tagImg = p.querySelectorAll('img');
          let textContent = p.textContent.trim();
          const startsWithQuote = textContent.startsWith('“') || textContent.startsWith('"');
          const endsWithQuote = textContent.endsWith('”') || textContent.endsWith('"');
          let textHtml = p.innerHTML.replace(/(?:h[1-6]|h [1-6]|header tag [1-6]|header tag[1-6]|header[1-6]|header [1-6]) ?/gi, '').trim();
          if (textHtml.startsWith(':')) {
            textHtml = textHtml.replace(':', '').trim();
          }

          if (textContent.startsWith('สารบัญ') || textContent.startsWith('คลิกอ่านหัวข้อ')) {
            p.outerHTML = `<!-- wp:paragraph {"className":"subtext-gtb"} --><p class="subtext-gtb">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if ((!textContent && tagImg.length === 0) || textContent.startsWith('alt') || textContent.startsWith('Alt') || textContent.startsWith('ALT') || textContent.startsWith('(alt') || textContent.startsWith('(Alt') || textContent.startsWith('(ALT')) {
            p.remove();
          } else if (textContent.startsWith('อ่านบทความเพิ่มเติม') || textContent.startsWith('อ่านเพิ่มเติม') || textContent.startsWith('คลิกอ่านเพิ่มเติม') || textContent.startsWith('คลิกอ่านบทความ') || textContent.startsWith('หมอได้สรุปข้อมูล')) {
            p.outerHTML = `<!-- wp:paragraph {"className":"vsq-readmore"} --><p class="vsq-readmore">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if (textContent.replace(/(?:h[1-6]|h [1-6]|header tag [1-6]|header tag[1-6]|header[1-6]|header [1-6]) ?/gi, '').replace(':', '').trim().startsWith('สรุป')) {
            textHtml = textHtml.replace(/<\/?[^>]+(>|$)/g, '').replace(':', '').trim();
            p.outerHTML = `<!-- wp:paragraph {"className":"subtext-gtb"} --><p class="subtext-gtb">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if (textContent.startsWith('อ้างอิง') || textContent.startsWith('เอกสารอ้างอิง') || textContent.startsWith('เอกสาร อ้างอิง') || textContent.startsWith('แหล่งข้อมูลอ้างอิง')) {
            p.outerHTML = `<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity"/><!-- /wp:separator --><!-- wp:paragraph {"className":"references"} --><p class="references">${textHtml}</p><!-- /wp:paragraph -->`;
            checkReferences = true;
          } else if (textContent === 'บทความเจาะลึก' || textContent === 'บทความแนะนำ') {
            p.outerHTML = `<!-- wp:paragraph {"align":"center","className":"headline"} --><p class="has-text-align-center headline">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if (textContent.startsWith('https://youtu.be') || textContent.startsWith('https://www.youtube') || textContent.startsWith('https://youtube')) {
            p.outerHTML = `<!-- wp:embed {"url":"${textContent}","type":"video","providerNameSlug":"youtube","responsive":true,"align":"center","className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} --><figure class="wp-block-embed aligncenter is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">${textContent}</div></figure><!-- /wp:embed -->`;
          } else if (tagImg.length > 0) {
            if (tagImg.length > 1) {
              const newImgItems = Array.from(tagImg).map(img => {
                return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"","kbVersion":2} --><div class="wp-block-kadence-column"><div class="kt-inside-inner-col"><!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image --></div></div><!-- /wp:kadence/column -->`;
              }).join('');
              p.outerHTML = `<!-- wp:kadence/rowlayout {"uniqueID":"","colLayout":"equal","firstColumnWidth":0,"secondColumnWidth":0,"thirdColumnWidth":0,"fourthColumnWidth":0,"fifthColumnWidth":0,"sixthColumnWidth":0,"kbVersion":2} -->${newImgItems}<!-- /wp:kadence/rowlayout -->`;
            } else {
              p.outerHTML = `<!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
            }
          } else if (startsWithQuote && endsWithQuote) {
            textContent = textContent.slice(1, -1).trim();
            p.outerHTML = `<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>${textContent}</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote -->`;
          } else if (textContent.startsWith('ข้อควรรู้')) {
            p.outerHTML = `<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>${textContent}</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote -->`;
          } else if (textContent === 'แอด Line@ เพื่อรับโปรโมชั่น' || textContent === 'แอด Line@ เพื่อรับโปรโมชัน') {
            const hasLink = p.querySelector('a') !== null;
            if (hasLink) {
              const Link = p.querySelector('a').getAttribute('href');
              p.outerHTML = `<!-- wp:paragraph {"align":"center","className":"headline"} --><p class="has-text-align-center headline">${textContent}</p><!-- /wp:paragraph --><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button {"className":"btn-addline"} --><div class="wp-block-button btn-addline"><a class="wp-block-button__link wp-element-button" href="${Link}">Add LINE</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`;
            } else {
              p.outerHTML = `<!-- wp:paragraph {"align":"center","className":"headline"} --><p class="has-text-align-center headline">${textContent}</p><!-- /wp:paragraph --><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button {"className":"btn-addline"} --><div class="wp-block-button btn-addline"><a class="wp-block-button__link wp-element-button">Add LINE</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`;
            }
          } else {
            if (checkReferences) {
              p.outerHTML = `<!-- wp:paragraph {"className":"references"} --><p class="references">${textHtml}</p><!-- /wp:paragraph -->`;
            } else {
              p.outerHTML = `<!-- wp:paragraph --><p>${textHtml}</p><!-- /wp:paragraph -->`;
            }
          }
        });

        // Remove <a> tags within headings
        doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
          heading.querySelectorAll('a').forEach(a => {
            const parent = a.parentNode;
            while (a.firstChild) parent.insertBefore(a.firstChild, a);
            parent.removeChild(a);
          });
        });

        // Convert heading tags to Gutenberg format
        doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index) => {
          const level = heading.tagName.toLowerCase();
          const levelNumber = level.match(/\d+/)[0];
          const headingContent = heading.innerHTML.trim();
          let headingText = headingContent.replace(/1st/gi, '').replace(/(?:h[1-6]|h [1-6]|header tag [1-6]|header tag[1-6]|header[1-6]|header [1-6]) ?/gi, '').trim();
          if (headingText.startsWith(':')) {
            headingText = headingText.replace(':', '').trim();
          }
          const hashTagId = headingText.toLowerCase().replace(/\?/g, '').trim().replace(/\s+/g, '-').replace('.', '').replace(/<\/?[^>]+(>|$)/g, ''); 
          const tagImg = heading.querySelectorAll('img');
          const textOnly = headingText.replace(/<\/?[^>]+(>|$)/g, '');
          let blockSeparator = `<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity"/><!-- /wp:separator -->`;
          let blockTarget = `<!-- wp:ps2id-block/target --><div class="wp-block-ps2id-block-target" id="${hashTagId}"></div><!-- /wp:ps2id-block/target -->`;
          let classBlock = `class="wp-block-heading"`;
          let attrLevel = ` {"level":${levelNumber}}`;
          if (level === 'h2') {
            attrLevel = '';
          }
          if (index === 0) {
            blockSeparator = '';
            blockTarget = '';
          }
          // console.log('TEXT: ' + textOnly + ' | IMG: ' + tagImg.length);
          // console.log('number: ' + index + ' | TEXT: ' + textOnly);

          let gutenbergHeading = '';

          if (!textOnly && tagImg.length === 0) {
            heading.remove();
          } else {
            if (textOnly && tagImg.length > 0) {
              if (tagImg.length > 1) {
                const newImgItems = Array.from(tagImg).map(img => {
                  return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"","kbVersion":2} --><div class="wp-block-kadence-column"><div class="kt-inside-inner-col"><!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image --></div></div><!-- /wp:kadence/column -->`;
                }).join('');
                gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading --><!-- wp:kadence/rowlayout {"uniqueID":"","colLayout":"equal","firstColumnWidth":0,"secondColumnWidth":0,"thirdColumnWidth":0,"fourthColumnWidth":0,"fifthColumnWidth":0,"sixthColumnWidth":0,"kbVersion":2} -->${newImgItems}<!-- /wp:kadence/rowlayout -->`;
              } else {
                gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading --><!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
              }
            } else if (!textOnly && tagImg.length > 0) {
              if (tagImg.length > 1) {
                const newImgItems = Array.from(tagImg).map(img => {
                  return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"","kbVersion":2} --><div class="wp-block-kadence-column"><div class="kt-inside-inner-col"><!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image --></div></div><!-- /wp:kadence/column -->`;
                }).join('');
                gutenbergHeading = `<!-- wp:kadence/rowlayout {"uniqueID":"","colLayout":"equal","firstColumnWidth":0,"secondColumnWidth":0,"thirdColumnWidth":0,"fourthColumnWidth":0,"fifthColumnWidth":0,"sixthColumnWidth":0,"kbVersion":2} -->${newImgItems}<!-- /wp:kadence/rowlayout -->`;
              } else {
                gutenbergHeading = `<!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
              }
            } else {
              if (textOnly.startsWith('Q&A') || textOnly.startsWith('Q&amp;A') || textOnly.startsWith('คำถามที่พบบ่อย')) {
                if (level === 'h2') {
                  attrLevel = ` {"textAlign":"center","className":"label-heading"}`;
                } else {
                  attrLevel = ` {"textAlign":"center","level":${levelNumber},"className":"label-heading"}`;
                }
                classBlock = `class="wp-block-heading has-text-align-center label-heading"`;
              } else if (textOnly === 'สรุป') {
                if (level === 'h2') {
                  attrLevel = ` {"className":"subtext-gtb"}`;
                  classBlock = `class="wp-block-heading subtext-gtb"`;
                }
              }


              if (level === 'h2') {
                gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
              } else if (level === 'h4' || level === 'h5' || level === 'h6') {
                gutenbergHeading = `<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
              } else {
                if (textOnly === 'สรุป') {
                  gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
                } else {
                  gutenbergHeading = `${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
                }
              }
            }

            heading.outerHTML = gutenbergHeading;
          }
        });

        // Remove all <img> tags
        // doc.querySelectorAll('img').forEach(img => {
        //   img.outerHTML = `<!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
        // });

        function convertSubListToGutenberg(ul, tag, classPrev) {
          let tagComment = '<!-- wp:list -->';
          if (classPrev === 'references') {
            tagComment = '<!-- wp:list {"className":"references"} -->';
          }
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
            if (classPrev === 'references') {
              tagComment = '<!-- wp:list {"ordered":true,"className":"references"} -->';
            }
          }
          const newListItems = Array.from(ul.querySelectorAll('li')).map(li => {
            return `<!-- wp:list-item --><li>${li.innerHTML}</li><!-- /wp:list-item -->`;
          }).join('');
          return `${tagComment}<${tag}>${newListItems}</${tag}><!-- /wp:list -->`;
        }

        function convertListToGutenberg(ul, tag, classPrev) {
          let tagComment = '<!-- wp:list -->';
          if (classPrev === 'references') {
            tagComment = '<!-- wp:list {"className":"references"} -->';
          }
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
            if (classPrev === 'references') {
              tagComment = '<!-- wp:list {"ordered":true,"className":"references"} -->';
            }
          }
          const listItems = Array.from(ul.children).map(li => {
            const nestedUl = li.querySelector('ul');
            if (nestedUl) {
              const listSubItems = convertSubListToGutenberg(nestedUl, tag);
              nestedUl.remove();
              return `<!-- wp:list-item --><li>${li.innerHTML}${listSubItems}</li><!-- /wp:list-item -->`;
            }
            return `<!-- wp:list-item --><li>${li.innerHTML}</li><!-- /wp:list-item -->`;
          }).join('');
          return `${tagComment}<${tag}>${listItems}</${tag}><!-- /wp:list -->`;
        }

        function convertSubListToMenu(ul, tag) {
          let tagComment = '<!-- wp:list -->';
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
          }
          const newListItems = Array.from(ul.querySelectorAll('li')).map(li => {
            const liText = li.textContent.replace(/(?:h[1-6]|Header Tag ?[1-6]|Header Tag?[1-6]|header tag ?[1-6]|header tag?[1-6]) ?: ?/gi, '').trim();
            const hashTagId = liText.toLowerCase().replace('.', '').replace(/\?/g, '').replace('/', '').trim().replace(/\s+/g, '-');
            return `<!-- wp:list-item --><li><a href="#${hashTagId}">${liText}</a></li><!-- /wp:list-item -->`;
          }).join('');
          return `${tagComment}<${tag}>${newListItems}</${tag}><!-- /wp:list -->`;
        }

        function convertListToMenu(ul, tag) {
          let tagComment = '<!-- wp:list -->';
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
          }
          const listItems = Array.from(ul.children).map(li => {
            const liText = li.textContent.replace(/(?:h[1-6]|Header Tag ?[1-6]|Header Tag?[1-6]|header tag ?[1-6]|header tag?[1-6]) ?: ?/gi, '').trim();
            const hashTagId = liText.toLowerCase().replace('.', '').replace(/\?/g, '').replace('/', '').trim().replace(/\s+/g, '-');
            const nestedUl = li.querySelector('ul');
            if (nestedUl) {
              const listSubItems = convertSubListToMenu(nestedUl, tag);
              nestedUl.remove();
              const liSubText = li.textContent.replace(/(?:h[1-6]|Header Tag ?[1-6]|Header Tag?[1-6]|header tag ?[1-6]|header tag?[1-6]) ?: ?/gi, '').trim();
              const hashTagIdSub = liSubText.toLowerCase().replace(':', '').replace('.', '').replace(/\?/g, '').replace('/', '').trim().replace(/\s+/g, '-');
              return `<!-- wp:list-item --><li><a href="#${hashTagIdSub}">${liSubText}</a>${listSubItems}</li><!-- /wp:list-item -->`;
            }
            return `<!-- wp:list-item --><li><a href="#${hashTagId}">${liText}</a></li><!-- /wp:list-item -->`;
          }).join('');
          return `${tagComment}<${tag}>${listItems}</${tag}><!-- /wp:list -->`;
        }

        // Convert all <ul> and <ol> elements with a combined counter to add class to the first found
        // let firstListProcessed = false;
        doc.querySelectorAll('ul, ol').forEach((list, index) => {
          let listHTML = '';
          const tag = list.tagName.toLowerCase();
          const previousElement = list.previousElementSibling;
          // if (!firstListProcessed) {
          if (index === 0) {
            listHTML = convertListToMenu(list, tag);
            listHTML = listHTML.replace(`<${tag}>`, `<${tag} class="listmenu two-column">`);
            // firstListProcessed = true;
          } else {
            if (previousElement && previousElement.classList.contains('references')) {
              const className = previousElement.className;
              // console.log('Class name:', className);
              listHTML = convertListToGutenberg(list, tag, className);
              listHTML = listHTML.replace(`<${tag}>`, `<${tag} class="references">`);
            } else {
              listHTML = convertListToGutenberg(list, tag, null);
            }
          }
          list.innerHTML = listHTML;
          const parentList = list.closest(tag);
          if (parentList) {
            parentList.replaceWith(...parentList.childNodes);
          }
        });

        // Convert all <table> elements
        doc.querySelectorAll('table').forEach(table => {
          const colItem = table.querySelectorAll('th, td').length;
          const rows = Array.from(table.querySelectorAll('tr'));
          if (colItem === 1) {
            const Cells = Array.from(rows.shift().querySelectorAll('th, td')).map(cell => {
              const hasLink = cell.querySelector('a') !== null;
              const cellText = cell.textContent.trim();
              if (hasLink) {
                const Link = cell.querySelector('a').getAttribute('href');
                return `<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${Link}">${cellText}</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`;
              } else {
                return `<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">${cellText}</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`;
              }
            }).join('');
            table.outerHTML = `${Cells}`;
          } else {
            let theadContent = '';
            let tbodyContent = '';
            rows.forEach((tr, index) => {
              const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => {
                let cellContent = cell.innerHTML.replace(/<!-- wp:paragraph --><p>/g, '').replace(/<\/p><!-- \/wp:paragraph -->/g, '').trim();
                const hasList = cell.querySelectorAll('ul, ol') !== null;
                if (hasList) {
                  cellContent = cellContent.replace(/<!-- wp:list {"className":"references"} -->/g, '').replace(/<!-- wp:list {"ordered":true} -->/g, '').replace(/<!-- wp:list -->/g, '').replace(/<!-- \/wp:list -->/g, '').replace(/<!-- wp:list-item -->/g, '').replace(/<!-- \/wp:list-item -->/g, '').replace(/ class="references"/g, '');
                }

                const tagName = cell.tagName.toLowerCase();
                return `<${tagName}${cell.hasAttributes() ? ' ' + Array.from(cell.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ') : ''}>${cellContent}</${tagName}>`;
              }).join(''); 

              if (index === 0) {
                theadContent = `<thead><tr>${cells.replace(/<td/g, '<th').replace(/<\/td/g, '</th')}</tr></thead>`;
              } else {
                const tbodyCells = cells.replace(/<th/g, '<td').replace(/<\/th/g, '</td');
                tbodyContent += `<tr>${tbodyCells}</tr>`;
              }
            });

            tbodyContent = `<tbody>${tbodyContent}</tbody>`;
            table.outerHTML = `<!-- wp:table --><figure class="wp-block-table"><table>${theadContent}${tbodyContent}</table></figure><!-- /wp:table -->`;
          }
        });

        // Serialize the DOM back to a string
        htmlString = new XMLSerializer().serializeToString(doc);

        // Remove the <html>, <head>, and <body> tags from the string
        htmlString = htmlString.replace(/<html[^>]*>/, '').replace('</html>', '');
        htmlString = htmlString.replace('<head></head>', '');
        htmlString = htmlString.replace(/<body[^>]*>/, '').replace('</body>', '');

        // Remove extra spaces or tabs to ensure only one space between words
        htmlString = htmlString.replace(/\s+/g, ' ');

        // Add new lines after closing tags for readability
        htmlString = htmlString.replace(/<!--/g, '\n<!--');
        htmlString = htmlString.replace(/-->/g, '-->\n');
        htmlString = htmlString.replace(/𝗖𝗼𝗼𝗹 𝗬𝗮𝗴 𝟭𝟬𝟲𝟰/g, 'Cool Yag 1064');

        setHtmlContent(htmlString.trim());
      } catch (error) {
        console.error('Conversion error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Docx to Gutenberg Code App</title>
        <meta name="description" content="Docx to Gutenberg Code App" />
      </Helmet>
      <div className="container">
        <div className="site-content">
          <div className="col-left">
            <div className="space-left">
              <h1>Docx to <span>Gutenberg</span> Converter</h1>
              <div className="upload-file">
                <input type="file" accept=".docx" onChange={handleFileChange} />
                <div className={`upload-file-btn ${file ? 'active' : ''}`}>
                  <div className="upload-file-icon">
                    <FontAwesomeIcon icon={faFileArrowUp} />
                  </div>
                  <div className="upload-file-detail">
                    <span className="upload-file-label"><strong>Click to upload</strong> or drag and drop<br />DOCX are Allowed.</span>
                  </div>
                </div>
              </div>
              {isLoading ? (
                <button className="submit-btn loading" onClick={handleConvert}>
                  LOADING...
                  <FontAwesomeIcon icon={faCircleNotch} spin />
                </button>
              ) : (
                <button className={`submit-btn ${file ? '' : 'disable'}`} onClick={handleConvert}>
                  CONVERT
                  <FontAwesomeIcon icon={faFileImport} />
                </button>
              )}
              <div className="upload-desc">
                <p>for websites :</p>
                <ul>
                  <li>vsquareclinic.com</li>
                  <li>vsqclinic.com</li>
                  <li>vsquareconsult.com</li>
                  <li>vsquare-under-eye.com</li>
                  <li>vsquareclinic.co</li>
                  <li>vsq-injector.com</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-right">
            <div className="space-right">
              <div className="code-content">
                <SyntaxHighlighter language="javascript" style={vscDarkPlus} className="syntax-highlighter" showLineNumbers>
                  {htmlContent}
                </SyntaxHighlighter>
                <button onClick={handleCopy} className="copy-btn">
                  <FontAwesomeIcon icon={faCopy} />
                  {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}

export default Home;