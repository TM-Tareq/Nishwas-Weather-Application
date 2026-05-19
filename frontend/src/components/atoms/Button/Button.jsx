import { Loader2 } from 'lucide-react';

const Button = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    disabled = false,
    type = 'button',
    onClick,
    children,
}) => {
    const variantStyles = {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    }

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    const widthSyte = fullWidth ? 'w-full' : '';

    // Combine all styles
    const finalClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthSyte}`;


  // Button disabled if explicitly disabled OR currently loading
    const isButtonDisabled = disabled || isLoading;

    return <>
        <button
          type={type}
          className={finalClassName}
          onClick={onClick}
          disabled={isButtonDisabled}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                </span>
            ) : (
                children
            )}
        </button>
    </>
};

export default Button