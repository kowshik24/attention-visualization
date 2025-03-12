document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const processBtn = document.getElementById('processBtn');
    const attentionType = document.getElementById('attentionType');
    const attentionMatrix = document.getElementById('attentionMatrix');
    const insightsElement = document.getElementById('insights');
    const sentencesList = document.getElementById('sentencesList');
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const attentionScore = document.getElementById('attentionScore');
    
    // Set the GitHub username
    document.getElementById('username').textContent = 'kowshik24';
    
    // Process button click event
    processBtn.addEventListener('click', () => {
        processText();
    });
    
    // Default processing on load
    setTimeout(processText, 500);
    
    // Documentation panel toggle
    const docToggle = document.querySelector('.doc-toggle');
    const docPanel = document.querySelector('.documentation-panel');
    
    docToggle.addEventListener('click', () => {
        docPanel.classList.toggle('active');
        docToggle.textContent = docPanel.classList.contains('active') ? 'Close' : 'Documentation';
    });
    
    function processText() {
        // Parse sentences
        const text = inputText.value.trim();
        const sentences = parseSentences(text);
        
        if (sentences.length <= 1) {
            alert("Please enter at least two sentences to visualize attention between them.");
            return;
        }
        
        // Create sentence embeddings (simplified here with random vectors)
        const embeddings = createEmbeddings(sentences);
        
        // Calculate attention matrix
        const attention = calculateAttention(embeddings, attentionType.value);
        
        // Display attention matrix
        displayAttentionMatrix(sentences, attention);
        
        // Generate and display insights
        const insights = generateInsights(sentences, attention);
        displayInsights(insights);
        
        // Display sentences
        displaySentences(sentences);
        
        // Reset relationship view
        resetRelationshipView();
    }
    
    function parseSentences(text) {
        // Split text into sentences
        const regex = /[^.!?]+[.!?]+/g;
        const matches = text.match(regex);
        
        // Clean and return sentences
        return matches 
            ? matches.map(sentence => sentence.trim()).filter(s => s.length > 0)
            : [];
    }
    
    function createEmbeddings(sentences) {
        // In a real implementation, you would use a pre-trained model to create embeddings
        // Here we're simulating embeddings with random vectors of dimension 50
        return sentences.map(sentence => {
            // Create a deterministic vector based on the sentence content
            // This ensures the same sentence always gets the same vector
            const seed = hashString(sentence);
            const vector = [];
            
            for (let i = 0; i < 50; i++) {
                // Use a seeded random generator based on the character codes and position
                vector.push(pseudoRandom(seed + i) * 2 - 1); // values between -1 and 1
            }
            
            // Normalize the vector to unit length
            const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            return vector.map(val => val / magnitude);
        });
    }
    
    function hashString(str) {
        // Simple hash function to create a numeric seed from a string
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
    
    function pseudoRandom(seed) {
        // Simple deterministic random number generator
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    function calculateAttention(embeddings, type) {
        const numSentences = embeddings.length;
        const attention = Array(numSentences).fill().map(() => Array(numSentences).fill(0));
        
        for (let i = 0; i < numSentences; i++) {
            for (let j = 0; j < numSentences; j++) {
                switch (type) {
                    case 'cosine':
                        attention[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
                        break;
                    case 'dotProduct':
                        attention[i][j] = dotProduct(embeddings[i], embeddings[j]);
                        // Normalize to [0,1]
                        attention[i][j] = (attention[i][j] + 1) / 2;
                        break;
                    case 'scaled':
                        // Scaled dot product attention (similar to transformer attention)
                        const scalingFactor = Math.sqrt(embeddings[i].length);
                        attention[i][j] = dotProduct(embeddings[i], embeddings[j]) / scalingFactor;
                        // Normalize to [0,1]
                        attention[i][j] = (attention[i][j] + 1) / 2;
                        break;
                    default:
                        attention[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
                }
            }
        }
        
        return attention;
    }
    
    function cosineSimilarity(vecA, vecB) {
        const dotProd = dotProduct(vecA, vecB);
        // Vectors are already normalized in createEmbeddings,
        // so the denominator would be 1
        return (dotProd + 1) / 2; // Convert from [-1,1] to [0,1]
    }
    
    function dotProduct(vecA, vecB) {
        return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    }
    
    function displayAttentionMatrix(sentences, attention) {
        attentionMatrix.innerHTML = '';
        
        // Create header row with labels
        const headerRow = document.createElement('div');
        headerRow.className = 'matrix-row';
        
        // Empty cell for top-left corner
        const cornerCell = document.createElement('div');
        cornerCell.className = 'matrix-label';
        headerRow.appendChild(cornerCell);
        
        // Column headers (target sentences)
        for (let j = 0; j < sentences.length; j++) {
            const label = document.createElement('div');
            label.className = 'matrix-label';
            label.textContent = `S${j+1}`;
            label.title = sentences[j];
            headerRow.appendChild(label);
        }
        
        attentionMatrix.appendChild(headerRow);
        
        // Create matrix rows
        for (let i = 0; i < sentences.length; i++) {
            const row = document.createElement('div');
            row.className = 'matrix-row';
            
            // Row label (source sentence)
            const rowLabel = document.createElement('div');
            rowLabel.className = 'matrix-label';
            rowLabel.textContent = `S${i+1}`;
            rowLabel.title = sentences[i];
            row.appendChild(rowLabel);
            
            // Cells
            for (let j = 0; j < sentences.length; j++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                
                // Color based on attention value (red intensity)
                const intensity = Math.round(attention[i][j] * 255);
                cell.style.backgroundColor = `rgb(255, ${255 - intensity}, ${255 - intensity})`;
                
                // Display the value
                cell.textContent = attention[i][j].toFixed(2);
                
                // Add click event
                cell.addEventListener('click', () => {
                    displayRelationship(sentences[i], sentences[j], attention[i][j]);
                    highlightCell(i, j);
                });
                
                row.appendChild(cell);
                
                // Add tooltips to cells
                enhanceMatrixCell(cell, i, j, attention, sentences);
            }
            
            attentionMatrix.appendChild(row);
        }
    }
    
    let activeCell = null;
    
    function highlightCell(i, j) {
        // Remove previous highlight
        if (activeCell) {
            activeCell.style.border = 'none';
            activeCell.style.transform = '';
        }
        
        // Highlight new cell
        const rows = attentionMatrix.querySelectorAll('.matrix-row');
        if (rows.length > i + 1) {  // +1 for header row
            const cells = rows[i + 1].querySelectorAll('.matrix-cell');
            if (cells.length > j) {
                activeCell = cells[j];
                activeCell.style.border = '2px solid black';
                activeCell.style.transform = 'scale(1.1)';
            }
        }
    }
    
    function displayRelationship(source, target, score) {
        sourceText.textContent = source;
        targetText.textContent = target;
        // Format score to percentage for better readability
        const scorePercentage = (score * 100).toFixed(1);
        attentionScore.innerHTML = `
            <div>Attention score: ${scorePercentage}%</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                Step-by-step:
                <ol style="margin-top: 5px; text-align: left;">
                    <li>Convert sentences to vectors</li>
                    <li>Calculate similarity score</li>
                    <li>Normalize to percentage</li>
                </ol>
            </div>
        `;
        
        // Highlight common words
        highlightCommonWords(source, target);
    }
    
    function highlightCommonWords(source, target) {
        // Extract words (simplistic approach)
        const sourceWords = source.toLowerCase().match(/\b\w+\b/g) || [];
        const targetWords = target.toLowerCase().match(/\b\w+\b/g) || [];
        
        // Find common words
        const commonWords = sourceWords.filter(word => 
            targetWords.includes(word) && word.length > 2  // Ignore very short words
        );
        
        // Highlight in source and target
        let highlightedSource = source;
        let highlightedTarget = target;
        
        commonWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            highlightedSource = highlightedSource.replace(regex, `<span class="highlight" style="background-color: #ffdd80; font-weight: bold;">$&</span>`);
            highlightedTarget = highlightedTarget.replace(regex, `<span class="highlight" style="background-color: #ffdd80; font-weight: bold;">$&</span>`);
        });
        
        sourceText.innerHTML = highlightedSource;
        targetText.innerHTML = highlightedTarget;
    }
    
    function resetRelationshipView() {
        sourceText.textContent = 'Click on any cell in the attention matrix to see the source sentence';
        targetText.textContent = 'Click on any cell in the attention matrix to see the target sentence';
        attentionScore.innerHTML = `
            <div>Attention score: Waiting for selection</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                Click any cell in the matrix above to see the relationship between two sentences
            </div>
        `;
    }
    
    function displaySentences(sentences) {
        sentencesList.innerHTML = '';
        
        sentences.forEach((sentence, index) => {
            const sentenceElement = document.createElement('div');
            sentenceElement.className = 'sentence-item';
            sentenceElement.innerHTML = `<strong>S${index+1}:</strong> ${sentence}`;
            sentencesList.appendChild(sentenceElement);
        });
    }
    
    function generateInsights(sentences, attention) {
        const insights = {
            sentenceCount: sentences.length,  // Add sentence count
            highestAttention: { value: 0, source: -1, target: -1 },
            lowestAttention: { value: 1, source: -1, target: -1 },
            selfAttention: [],
            averageAttention: 0,
            clusters: []
        };
        
        let sum = 0;
        let count = 0;
        
        // Find highest and lowest attention pairs (excluding self-attention)
        for (let i = 0; i < sentences.length; i++) {
            for (let j = 0; j < sentences.length; j++) {
                if (i !== j) {
                    sum += attention[i][j];
                    count++;
                    
                    if (attention[i][j] > insights.highestAttention.value) {
                        insights.highestAttention = { 
                            value: attention[i][j], 
                            source: i, 
                            target: j 
                        };
                    }
                    
                    if (attention[i][j] < insights.lowestAttention.value) {
                        insights.lowestAttention = { 
                            value: attention[i][j], 
                            source: i, 
                            target: j 
                        };
                    }
                } else {
                    insights.selfAttention.push({
                        index: i,
                        value: attention[i][i]
                    });
                }
            }
        }
        
        insights.averageAttention = count > 0 ? sum / count : 0;
        
        // Find clusters (simplified approach)
        // We consider sentences with attention > 0.7 to be in the same cluster
        const visited = new Set();
        
        for (let i = 0; i < sentences.length; i++) {
            if (!visited.has(i)) {
                const cluster = [i];
                visited.add(i);
                
                // Find related sentences
                for (let j = 0; j < sentences.length; j++) {
                    if (i !== j && !visited.has(j) && 
                        (attention[i][j] > 0.7 || attention[j][i] > 0.7)) {
                        cluster.push(j);
                        visited.add(j);
                    }
                }
                
                if (cluster.length > 1) {
                    insights.clusters.push(cluster);
                }
            }
        }
        
        return insights;
    }
    
    function displayInsights(insights) {
        const highest = insights.highestAttention;
        const lowest = insights.lowestAttention;
        
        let insightsHTML = '<ul>';
        
        // Step-by-step process
        insightsHTML += '<li><strong>Processing Steps:</strong></li>';
        insightsHTML += `
            <ol style="margin-left: 20px; margin-bottom: 15px;">
                <li>Text split into ${insights.sentenceCount} sentences</li>
                <li>Generated sentence embeddings (50-dimensional vectors)</li>
                <li>Calculated attention scores between all pairs</li>
                <li>Found strongest and weakest relationships</li>
                <li>Identified potential sentence clusters</li>
            </ol>
        `;
        
        // Overall stats
        insightsHTML += `<li>Average attention between sentences: <strong>${insights.averageAttention.toFixed(2)}</strong></li>`;
        
        // Highest attention pair
        if (highest.source >= 0) {
            insightsHTML += `
                <li>Strongest relationship: 
                    <strong>S${highest.source + 1} → S${highest.target + 1}</strong> 
                    (score: ${highest.value.toFixed(2)})
                </li>
            `;
        }
        
        // Lowest attention pair
        if (lowest.source >= 0) {
            insightsHTML += `
                <li>Weakest relationship: 
                    <strong>S${lowest.source + 1} → S${lowest.target + 1}</strong> 
                    (score: ${lowest.value.toFixed(2)})
                </li>
            `;
        }
        
        // Clusters
        if (insights.clusters.length > 0) {
            insightsHTML += `<li>Detected ${insights.clusters.length} sentence clusters:</li>`;
            insightsHTML += '<ul>';
            insights.clusters.forEach((cluster, idx) => {
                const sentenceNumbers = cluster.map(idx => `S${idx + 1}`).join(', ');
                insightsHTML += `<li>Cluster ${idx + 1}: ${sentenceNumbers}</li>`;
            });
            insightsHTML += '</ul>';
        } else {
            insightsHTML += '<li>No clear sentence clusters detected.</li>';
        }
        
        insightsHTML += '</ul>';
        insightsHTML += '<p>Click on cells in the attention matrix to see detailed relationships between sentences.</p>';
        
        insightsElement.innerHTML = insightsHTML;
    }
    
    // Enhanced matrix cell tooltips
    function enhanceMatrixCell(cell, i, j, attention, sentences) {
        const similarity = attention[i][j];
        const sourcePreview = sentences[i].slice(0, 30) + (sentences[i].length > 30 ? '...' : '');
        const targetPreview = sentences[j].slice(0, 30) + (sentences[j].length > 30 ? '...' : '');
        
        cell.setAttribute('data-tooltip', 
            `Source: ${sourcePreview}\nTarget: ${targetPreview}\nSimilarity: ${(similarity * 100).toFixed(1)}%`
        );
    }
});