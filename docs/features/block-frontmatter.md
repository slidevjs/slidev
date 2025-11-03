<!DOCTYPE html>
<html lang='es'>
<head>  
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Colombia después del Frente Nacional</title>
    <script src='https://cdn.tailwindcss.com'></script>
    <link href='https://fonts.googleapis.com/css2?family=Coda&family=Hedvig+Letters+Sans&family=Jersey+15&family=Jersey+20+Charted&family=Liter&family=Luckiest+Guy&family=Oranienbaum&family=Press+Start+2P&family=Quattrocento+Sans&family=Sorts+Mill+Goudy&family=Unna&display=swap' rel='stylesheet'>
    <link href='https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.0.0/css/all.min.css' rel='stylesheet'>
    <script src='https://cdn.plot.ly/plotly-latest.min.js'></script>
    <script src='https://cdn.jsdelivr.net/npm/echarts@5.4.0/dist/echarts.min.js'></script>
    <script src='https://cdn.jsdmirror.com/npm/mathjax@3.2.2/es5/tex-svg.min.js'></script>
    <style type='text/tailwindcss'>
        @layer utilities {
            .ppt-slide {
                @apply relative w-[992px] h-[558px] mx-auto p-[30px] box-border overflow-hidden mb-[40px] bg-[#F4F1E9];
            }
        }
    </style>
<base target="_blank">
</head>

<body class='bg-gray-50 py-8'>
    <!-- Slide 1: Portada -->
    <div class="ppt-slide flex flex-col justify-center items-center text-center !bg-cover !bg-center" style="background-image: linear-gradient(rgba(42, 43, 42, 0.6), rgba(42, 43, 42, 0.6)), url(portada_colombia_post_frente.png);">
        <div class="w-full">
            <h1 class="text-8xl font-bold text-white mb-4" style="font-family: 'Sorts Mill Goudy', serif;">Colombia después del Frente Nacional</h1>
            <div class="w-48 h-1 bg-[#A72626] mx-auto mb-8"></div>
            <h2 class="text-3xl text-gray-200 max-w-4xl mx-auto" style="font-family: 'Oranienbaum', serif;">La transición hacia la democracia pluralista y el surgimiento de nuevos conflictos (1974-1990)</h2>
        </div>
        <div class="absolute bottom-[30px] text-center w-full">
            <p class="text-lg text-gray-300" style="font-family: 'Liter', serif;">Análisis histórico del período post-Frente Nacional</p>
        </div>
    </div>
    
    <!-- Slide 2: Índice -->
    <div class="ppt-slide flex items-center">
        <div class="w-1/2 flex flex-col justify-center pr-10">
            <h1 class="text-6xl font-bold text-[#2A2B2A] mb-12" style="font-family: 'Sorts Mill Goudy', serif;">Índice</h1>
            <div class="space-y-5">
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">01</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">El ocaso del Frente Nacional</span></div>
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">02</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Los presidentes del período</span></div>
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">03</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">La fragmentación política</span></div>
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">04</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">El auge del narcotráfico</span></div>
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">05</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Las guerrillas se fortalecen</span></div>
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">06</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">La crisis económica</span></div>
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">07</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Violencia y paramilitarismo</span></div>
                <div class="flex items-baseline"><span class="text-2xl font-bold text-[#A72626] mr-4" style="font-family: 'Sorts Mill Goudy', serif;">08</span><span class="text-xl text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Los intentos de paz</span></div>
            </div>
        </div>
        <div class="w-1/2 h-full">
            <img src="fragmentacion_politica.png" alt="Fragmentación política" class="w-full h-full object-cover">
        </div>
    </div>
    
    <!-- Slide 3: Capítulo -->
    <div class="ppt-slide flex items-center justify-center">
        <div class="text-center">
            <div class="w-32 h-1 bg-[#A72626] mx-auto mb-8"></div>
            <h1 class="text-7xl font-bold text-[#2A2B2A] mb-6" style="font-family: 'Sorts Mill Goudy', serif;">El fin de una era</h1>
            <h2 class="text-4xl text-[#3D3D3D] mb-12" style="font-family: 'Oranienbaum', serif;">y el inicio de otra</h2>
            <p class="text-2xl text-[#A72626]" style="font-family: 'Liter', serif;">1974-1990: Una transición inacabada</p>
        </div>
    </div>
    
    <!-- Slide 4: El ocaso del Frente Nacional -->
    <div class="ppt-slide flex flex-col justify-center">
        <div class="mb-8">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">El ocaso del Frente Nacional</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="grid grid-cols-5 gap-8">
            <div class="col-span-3">
                <p class="text-xl text-[#2A2B2A] leading-relaxed mb-4" style="font-family: 'Oranienbaum', serif;">El Frente Nacional (1958-1974) terminó tras <span class="bg-[#A72626AA]" style="color: #F4F1E9;">16 años de poder compartido</span> entre liberales y conservadores. Aunque inicialmente se pactó hasta 1974, las reformas constitucionales de 1968 extendieron el 'espíritu de gobierno compartido' hasta 1978.</p>
                <p class="text-xl text-[#2A2B2A] leading-relaxed" style="font-family: 'Oranienbaum', serif;">Alfonso López Michelsen ganó las elecciones de 1974 contra Belisario Betancur, marcando el retorno a la competencia electoral entre los partidos tradicionales, aunque <span class="bg-[#A72626AA]" style="color: #F4F1E9;">las diferencias ideológicas entre ellos habían desaparecido prácticamente</span>.</p>
            </div>
            <div class="col-span-2 flex flex-col justify-between">
                <div class="text-center">
                    <div class="text-6xl font-bold text-[#A72626]" style="font-family: 'Sorts Mill Goudy', serif;">16</div>
                    <div class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Años de poder compartido</div>
                </div>
                <div class="text-center">
                    <div class="text-6xl font-bold text-[#A72626]" style="font-family: 'Sorts Mill Goudy', serif;">1974</div>
                    <div class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Fin del Frente Nacional</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Slide 5: Los presidentes del período -->
    <div class="ppt-slide flex flex-col">
        <div class="mb-8">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">Los presidentes del período post-Frente Nacional</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="flex-1 grid grid-cols-4 gap-x-6">
            <div class="flex flex-col pt-4 border-t-4 border-[#A72626]">
                <div class="text-2xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">1974-1978</div>
                <h3 class="text-2xl font-bold text-[#2A2B2A] mb-3" style="font-family: 'Oranienbaum', serif;">Alfonso López Michelsen</h3>
                <p class="text-base text-[#3D3D3D] leading-relaxed" style="font-family: 'Liter', serif;">Implementó el 'desarrollismo económico' y enfrentó el gran paro cívico de 1977.</p>
            </div>
            <div class="flex flex-col pt-4 border-t-4 border-[#A72626]">
                <div class="text-2xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">1978-1982</div>
                <h3 class="text-2xl font-bold text-[#2A2B2A] mb-3" style="font-family: 'Oranienbaum', serif;">Julio César Turbay</h3>
                <p class="text-base text-[#3D3D3D] leading-relaxed" style="font-family: 'Liter', serif;">Impulsó el represivo Estatuto de Seguridad contra la guerrilla.</p>
            </div>
            <div class="flex flex-col pt-4 border-t-4 border-[#A72626]">
                <div class="text-2xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">1982-1986</div>
                <h3 class="text-2xl font-bold text-[#2A2B2A] mb-3" style="font-family: 'Oranienbaum', serif;">Belisario Betancur</h3>
                <p class="text-base text-[#3D3D3D] leading-relaxed" style="font-family: 'Liter', serif;">Inició diálogos de paz con las guerrillas y firmó acuerdos importantes.</p>
            </div>
            <div class="flex flex-col pt-4 border-t-4 border-[#A72626]">
                <div class="text-2xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">1986-1990</div>
                <h3 class="text-2xl font-bold text-[#2A2B2A] mb-3" style="font-family: 'Oranienbaum', serif;">Virgilio Barco</h3>
                <p class="text-base text-[#3D3D3D] leading-relaxed" style="font-family: 'Liter', serif;">Adoptó una postura dura contra el narcotráfico y los carteles.</p>
            </div>
        </div>
    </div>
    
    <!-- Slide 6: La fragmentación política -->
    <div class="ppt-slide flex flex-col">
        <div class="mb-8">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">La fragmentación política</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="flex-1 grid grid-cols-2 gap-12">
            <div class="flex flex-col justify-center">
                <p class="text-xl text-[#2A2B2A] leading-relaxed mb-6" style="font-family: 'Oranienbaum', serif;">Tras el Frente Nacional, los partidos tradicionales se fragmentaron internamente, reflejando la crisis de representación política y el surgimiento de nuevos liderazgos regionales que desafiaban el control de las élites bogotanas.</p>
                <div class="space-y-4">
                    <div>
                        <h3 class="text-xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">Liberalismo dividido</h3>
                        <p class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Lopistas, Jaramistas, Pastranistas</p>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">Conservatismo fracturado</h3>
                        <p class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Laureanistas, Alzatistas, Ospinistas</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-center">
                <img src="fragmentacion_politica.png" alt="Fragmentación política" class="w-full h-auto object-contain">
            </div>
        </div>
    </div>
    
    <!-- Slide 7: El auge del narcotráfico -->
    <div class="ppt-slide flex flex-col">
        <div class="mb-6">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">El auge del narcotráfico</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="flex-1 grid grid-cols-2 gap-12 items-center">
            <div class="flex flex-col justify-center">
                <p class="text-xl text-[#2A2B2A] leading-relaxed mb-6" style="font-family: 'Oranienbaum', serif;">En los años 70s y 80s, Colombia se convirtió en el <span class="bg-[#A72626AA]" style="color: #F4F1E9;">centro mundial de producción de cocaína</span>. Pablo Escobar y el Cartel de Medellín controlaron hasta el 80% del comercio mundial, generando ingresos de $420 millones semanales.</p>
                <div class="space-y-4">
                    <div class="flex items-center"><i class="fas fa-chart-line text-2xl text-[#A72626] w-8 text-center mr-3"></i><span class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Control del 80% del mercado mundial</span></div>
                    <div class="flex items-center"><i class="fas fa-dollar-sign text-2xl text-[#A72626] w-8 text-center mr-3"></i><span class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">$420 millones semanales en ingresos</span></div>
                    <div class="flex items-center"><i class="fas fa-skull text-2xl text-[#A72626] w-8 text-center mr-3"></i><span class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Corrupción institucional generalizada</span></div>
                </div>
            </div>
            <div class="flex flex-col items-center justify-center">
                <img src="narcotrafico_redes.png" alt="Redes de narcotráfico" class="w-full h-auto object-contain mb-4">
                <p class="text-base text-center text-[#3D3D3D]" style="font-family: 'Liter', serif;">El narcotráfico corrompió instituciones, financió campañas políticas y desató una ola de violencia sin precedentes.</p>
            </div>
        </div>
    </div>
    
    <!-- Slide 8: Las guerrillas se fortalecen -->
    <div class="ppt-slide flex flex-col">
        <div class="mb-6">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">Las guerrillas se fortalecen</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="flex-1 grid grid-cols-2 gap-12 items-center">
            <div class="flex items-center justify-center">
                <img src="conflicto_armado.png" alt="Conflicto armado" class="w-full h-auto object-contain">
            </div>
            <div class="flex flex-col justify-center">
                <p class="text-xl text-[#2A2B2A] leading-relaxed mb-6" style="font-family: 'Oranienbaum', serif;">Las guerrillas existentes (FARC, ELN, EPL) se fortalecieron, mientras surgió el M-19 en 1974 como respuesta al fraude electoral de 1970. Las FARC pasaron de 1,000 combatientes en 1970 a más de 7,000 en 1990.</p>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-gray-200 rounded-md"><span class="text-lg font-semibold text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">FARC</span><span class="text-base text-[#A72626] font-bold" style="font-family: 'Liter', serif;">7,000 combatientes (1990)</span></div>
                    <div class="flex justify-between items-center p-3 bg-gray-200 rounded-md"><span class="text-lg font-semibold text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">ELN</span><span class="text-base text-[#A72626] font-bold" style="font-family: 'Liter', serif;">2,300 combatientes (1990)</span></div>
                    <div class="flex justify-between items-center p-3 bg-gray-200 rounded-md"><span class="text-lg font-semibold text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">M-19</span><span class="text-base text-[#A72626] font-bold" style="font-family: 'Liter', serif;">Acciones urbanas espectaculares</span></div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Slide 9: La crisis económica de los 80s -->
    <div class="ppt-slide flex flex-col justify-center">
        <div class="mb-8">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">La crisis económica de los 80s</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="grid grid-cols-3 gap-8 mb-8 text-center">
            <div>
                <div class="text-5xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">27.2%</div>
                <div class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Inflación en 1963</div>
            </div>
            <div>
                <div class="text-5xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">Alto</div>
                <div class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Desempleo urbano</div>
            </div>
            <div>
                <div class="text-5xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">FMI</div>
                <div class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Ajuste estructural</div>
            </div>
        </div>
        <p class="text-xl text-[#2A2B2A] leading-relaxed text-center max-w-4xl mx-auto" style="font-family: 'Oranienbaum', serif;">Colombia enfrentó una severa crisis económica en los 80s, con alta inflación, devaluación y desempleo. La economía dependía del café y las drogas ilícitas. El gobierno implementó medidas de ajuste estructural bajo presión del FMI, generando protestas como el <span class="bg-[#A72626AA]" style="color: #F4F1E9;">gran paro de 1977</span>.</p>
    </div>
    
    <!-- Slide 10: Violencia y paramilitarismo -->
    <div class="ppt-slide flex flex-col justify-center">
        <div class="mb-8">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">Violencia y paramilitarismo</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="grid grid-cols-2 gap-12">
            <div class="flex flex-col justify-center">
                <p class="text-xl text-[#2A2B2A] leading-relaxed mb-6" style="font-family: 'Oranienbaum', serif;">El período se caracterizó por el aumento de la violencia política. Surgieron grupos paramilitares como <span class="bg-[#A72626AA]" style="color: #F4F1E9;">'Muerte a Secuestradores' (MAS)</span> en 1983, financiados por narcotraficantes y terratenientes.</p>
                <div class="space-y-3">
                    <div class="flex items-center"><i class="fas fa-crosshairs text-xl text-[#A72626] w-8 text-center mr-3"></i><span class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Sindicalistas y líderes sociales</span></div>
                    <div class="flex items-center"><i class="fas fa-user-tie text-xl text-[#A72626] w-8 text-center mr-3"></i><span class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Candidatos políticos</span></div>
                    <div class="flex items-center"><i class="fas fa-gavel text-xl text-[#A72626] w-8 text-center mr-3"></i><span class="text-lg text-[#3D3D3D]" style="font-family: 'Liter', serif;">Magistrados y jueces</span></div>
                </div>
            </div>
            <div class="flex flex-col justify-center items-center bg-gray-200 rounded-lg p-8">
                <div class="text-6xl font-bold text-[#A72626] mb-2" style="font-family: 'Sorts Mill Goudy', serif;">MAS</div>
                <div class="text-xl text-[#3D3D3D] mb-4" style="font-family: 'Oranienbaum', serif;">Muerte a Secuestradores</div>
                <div class="text-base text-[#3D3D3D] text-center" style="font-family: 'Liter', serif;">Fundado en 1983 por narcotraficantes y terratenientes como herramienta de contrainsurgencia.</div>
            </div>
        </div>
    </div>
    
    <!-- Slide 11: Los intentos de paz -->
    <div class="ppt-slide flex flex-col">
        <div class="mb-6">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">Los intentos de paz</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="flex-1 grid grid-cols-2 gap-12 items-center">
            <div class="flex flex-col justify-center">
                <p class="text-xl text-[#2A2B2A] leading-relaxed mb-6" style="font-family: 'Oranienbaum', serif;">Durante este período hubo varios intentos de paz. El gobierno de Belisario Betancur firmó acuerdos con varias guerrillas, como los de <span class="bg-[#A72626AA]" style="color: #F4F1E9;">Corinto (1984) y La Uribe (1984)</span>. Sin embargo, estos fracasaron por falta de voluntad política y sabotajes.</p>
                <div class="space-y-4">
                    <div class="p-4 bg-gray-200 rounded-lg">
                        <div class="text-lg font-bold text-[#A72626] mb-1" style="font-family: 'Oranienbaum', serif;">Acuerdo de Corinto (1984)</div>
                        <div class="text-base text-[#3D3D3D]" style="font-family: 'Liter', serif;">Con M-19 y EPL</div>
                    </div>
                    <div class="p-4 bg-gray-200 rounded-lg">
                        <div class="text-lg font-bold text-[#A72626] mb-1" style="font-family: 'Oranienbaum', serif;">Acuerdo de La Uribe (1984)</div>
                        <div class="text-base text-[#3D3D3D]" style="font-family: 'Liter', serif;">Con FARC-EP</div>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-center">
                <img src="procesos_paz.png" alt="Procesos de paz" class="w-full h-auto object-contain">
            </div>
        </div>
        <p class="text-base text-center text-[#3D3D3D] mt-4" style="font-family: 'Liter', serif;">La toma del Palacio de Justicia por el M-19 en 1985 marcó el fin de estas negociaciones.</p>
    </div>
    
    <!-- Slide 12: El legado del período -->
    <div class="ppt-slide flex flex-col justify-center">
        <div class="mb-8">
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">El legado del período</h1>
            <div class="w-24 h-1 bg-[#A72626]"></div>
        </div>
        <div class="grid grid-cols-2 gap-12 mb-8">
            <div>
                <h3 class="text-2xl font-bold text-[#A72626] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">Aspectos positivos</h3>
                <ul class="space-y-2 list-disc list-inside">
                    <li class="text-lg text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Democratización formal</li>
                    <li class="text-lg text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Competencia electoral real</li>
                    <li class="text-lg text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Base para la Constitución de 1991</li>
                </ul>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-[#A72626] mb-4" style="font-family: 'Sorts Mill Goudy', serif;">Aspectos negativos</h3>
                <ul class="space-y-2 list-disc list-inside">
                    <li class="text-lg text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Debilidad institucional</li>
                    <li class="text-lg text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Corrupción generalizada</li>
                    <li class="text-lg text-[#2A2B2A]" style="font-family: 'Oranienbaum', serif;">Violencia estructural</li>
                </ul>
            </div>
        </div>
        <p class="text-xl text-[#2A2B2A] leading-relaxed text-center max-w-4xl mx-auto" style="font-family: 'Oranienbaum', serif;">El período post-Frente Nacional dejó un legado complejo, consolidando el narcotráfico y el paramilitarismo como factores permanentes del conflicto colombiano.</p>
    </div>
    
    <!-- Slide 13: Conclusión -->
    <div class="ppt-slide flex items-center justify-center">
        <div class="text-center max-w-4xl">
            <div class="w-32 h-1 bg-[#A72626] mx-auto mb-8"></div>
            <h1 class="text-5xl font-bold text-[#2A2B2A] mb-8" style="font-family: 'Sorts Mill Goudy', serif;">Una transición inacabada</h1>
            <p class="text-2xl text-[#2A2B2A] leading-relaxed mb-8" style="font-family: 'Oranienbaum', serif;">Colombia después del Frente Nacional fue una nación en transición, buscando consolidar su democracia mientras enfrentaba desafíos sin precedentes.</p>
            <p class="text-xl text-[#3D3D3D]" style="font-family: 'Liter', serif;">El legado de este período sigue influyendo en la política y la sociedad colombiana hasta hoy.</p>
        </div>
    </div>
</body>
</html>
