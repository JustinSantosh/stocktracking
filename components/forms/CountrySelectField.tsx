"use client";

import countryList from "react-select-country-list";
import { Controller } from "react-hook-form";

import { Label } from "@/components/ui/Label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const countries = countryList().getData();

export const CountrySelectField = ({ name, label, control, error, required = false }: CountrySelectProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">
                {label}
            </Label>

            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `Please select ${label.toLowerCase()}` : false,
                }}
                render={({ field }) => (
                    <>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="select-trigger w-full">
                                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600 text-white">
                                {countries.map((country) => (
                                    <SelectItem
                                        value={country.value}
                                        key={country.value}
                                        className="focus:bg-gray-600 focus:text-white"
                                    >
                                        {country.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && <p className="text-sm text-red-500">{error.message}</p>}
                    </>
                )}
            />
        </div>
    );
};
