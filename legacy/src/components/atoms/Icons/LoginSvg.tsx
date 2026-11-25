import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
import COLORS from "../../../services/colors"

const LoginSvg = (props: SvgProps) => (
	<Svg
		width={24}
		height={24}
		viewBox='0 0 48 48'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<Path fill={COLORS.MAIN} fillOpacity={0.01} d='M0 0h48v48H0z' />
		<Path
			d='M23.992 6H6v36h18'
			stroke={COLORS.MAIN}
			strokeWidth={4}
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<Path
			d='m25 33-9-9 9-9M42 23.992H16'
			stroke={COLORS.MAIN}
			strokeWidth={4}
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</Svg>
)

export default LoginSvg
