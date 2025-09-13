/**
 * Usage:
 * - Add 'sticky top-0 z-50 bg-surface shadow-md' classes to your header container for sticky effect.
 * - For nav links, add this CSS for smooth underline animation on hover:
 *
 * .nav-link {
 *   position: relative;
 *   padding-bottom: 4px;
 *   transition: color 0.3s ease;
 * }
 * .nav-link::after {
 *   content: '';
 *   position: absolute;
 *   width: 0;
 *   height: 2px;
 *   bottom: 0;
 *   left: 0;
 *   background: linear-gradient(to right, #22c55e, #06b6d4); // emerald to cyan gradient
 *   transition: width 0.3s ease;
 *   border-radius: 2px;
 * }
 * .nav-link:hover::after,
 * .nav-link:focus::after {
 *   width: 100%;
 * }
 *
 * Example JSX for nav link:
 * <Link to="/path" className="nav-link text-textPrimary hover:text-primary">
 *   Link Text
 * </Link>
 */
